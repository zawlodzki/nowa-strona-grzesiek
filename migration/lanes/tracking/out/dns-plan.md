# DNS plan: zawlodzki.pl from OVH to Cloudflare

Owner: T05. Checked 2026-10-21. This file holds record names and types only. Values live in the gitignored `migration/lanes/tracking/private/zawlodzki.pl.zone`, which is regenerated from the inventory:

```bash
python3 -I migration/tools/zone-to-bind.py --verify
```

The tool writes the BIND file and digs every kept record at the OVH nameserver `ns11.ovh.net` with recursion off. It prints names, types and verdicts, never values. It exits non-zero on any mismatch.

## What goes into the Cloudflare zone

24 records from the 33 in `00-inventory/dns/zone-zawlodzki.pl.csv`. 9 are left out.

Left out:

| Type | Name | Why |
|---|---|---|
| NS ×2 | `@` | Cloudflare sets its own NS. The registrar change is a runbook step. |
| TXT | `@` (OVH redirect marker) | OVH artefact, inventory note says safe to drop. |
| CNAME | `ftp` | OVH default, unused. |
| CNAME | `autoconfig`, `autodiscover` | Stale OVH mail helpers. Mail is on Google Workspace. |
| SRV | `_autodiscover._tcp`, `_imaps._tcp`, `_submission._tcp` | Stale OVH mail helpers. |

All 9 are still served by OVH today. If anything turns out to depend on them, the inventory has the values and the tool can keep them by changing the row note.

Kept, by service:

| Service | Records |
|---|---|
| Website (Webflow until cutover) | A `@`, CNAME `www`, TXT `@` (Webflow proxy-ssl) |
| Google Workspace mail | MX `@` ×5, TXT `@` (SPF), TXT `google._domainkey`, TXT `_dmarc` |
| Verification tokens | TXT `@` ×2 (google-site-verification), TXT `@` (asv, owner unknown) |
| Mailgun EU | MX `email` ×2, TXT `email._domainkey.email`, CNAME `email.email` |
| Resend / SES | TXT `resend._domainkey.tech`, MX `send.tech`, TXT `send.tech`, MX `tech` |
| Other apps | CNAME `n8n` (Railway), CNAME `secure` (Vercel) |

## dig check against OVH

Result of `--verify` on 2026-10-21: 24 kept records, 0 mismatches. Every kept value is served by OVH with the TTL in the BIND file.

Differences between the inventory CSV and what OVH serves, by name and type:

| Name | Type | Difference | Handling |
|---|---|---|---|
| `@` | TXT | One row in the CSV lists TTL 86400. OVH serves the whole apex TXT set with 3600, because an RRset has one TTL. | The tool gives every RRset its lowest listed TTL. The BIND file says 3600. |
| `@` | TXT | OVH serves the OVH redirect marker, which the plan drops. | Intended. Reported as "served at OVH, dropped by plan". |

TTL 0 in the CSV means the OVH zone default. OVH serves those records with 3600, so the BIND file sets `$TTL 3600` and writes 3600 on each line.

## Proxied or DNS-only

At import every record is DNS-only (grey cloud). Untick "Proxy imported DNS records" in the Cloudflare import dialog.

| Record | Mode | Reason |
|---|---|---|
| A `@`, CNAME `www` | DNS-only until cutover | They point at Webflow, which issues its own certificate. At cutover both are replaced by Worker custom domains, which Cloudflare proxies. |
| CNAME `n8n` | DNS-only | Railway issues its own certificate. The form webhook must keep working through the switch. |
| CNAME `secure` | DNS-only | Vercel issues its own certificate. |
| CNAME `email.email` | DNS-only | Mailgun tracking host. |
| MX, TXT | not proxiable | Cloudflare only proxies A, AAAA and CNAME. |

## DNSSEC: observed state

Observed 2026-10-21, after the inventory was taken:

- `dig +norec @<each .pl NS> zawlodzki.pl DS` returns no DS. The answer is NODATA with the `pl.` SOA.
- `whois zawlodzki.pl` says `dnssec: Unsigned`.
- OVH still serves DNSKEY for the zone (one KSK and one ZSK, TTL 3600). The key tag of the KSK matches the DS the inventory recorded.

The inventory, taken earlier the same day, recorded a published DS and `dnssec: Signed`. So either DNSSEC was disabled at OVH between the two checks, or the registry dropped the DS for another reason. This task changed nothing at OVH. The user should confirm in OVH Manager what happened.

Consequence: the chain from `.pl` to the zone is already unsigned. A nameserver switch today would not break validation. Leftover DNSKEYs at OVH without a DS are harmless.

## DNSSEC: disable-and-wait sequence

This replaces step 2 of the PLAN.md section 8 runbook with exact checks. Every step that changes OVH or Cloudflare needs the user's yes at the time.

1. **Check the current state.** Run both commands. If both show no DS and `Unsigned`, skip to step 4 (this is the state observed on 2026-10-21).
   ```bash
   for ns in $(dig +short NS pl.); do dig +norec +noall +answer @$ns zawlodzki.pl DS; done
   whois zawlodzki.pl | grep -i dnssec
   ```
2. **Disable DNSSEC in OVH Manager** (Domains → zawlodzki.pl → DNSSEC → off). User action.
3. **Wait for the DS to leave the registry.** Repeat the step 1 loop until no `.pl` nameserver returns a DS. OVH usually takes minutes to hours.
4. **Wait out cached DS.** Resolvers may hold the old DS for its TTL. The `.pl` DS TTL is commonly 86400 (inventory note, not measured: no DS is left to read the TTL from). Wait 24 h after the last time any `.pl` nameserver returned a DS. If the time it disappeared is unknown, wait 24 h from step 1. Also wait one DNSKEY TTL (3600 s, measured) so nothing cached still expects signatures.
5. **Check a validating resolver.** The answer must have no `ad` flag and status `NOERROR`, not `SERVFAIL`.
   ```bash
   dig +dnssec zawlodzki.pl SOA @1.1.1.1 | grep -E 'status|flags'
   dig +dnssec zawlodzki.pl SOA @8.8.8.8 | grep -E 'status|flags'
   ```
6. **Switch nameservers at OVH to the two Cloudflare NS** (runbook step 4). The `.pl` delegation NS TTL is 86400 (measured), so old and new nameservers both answer for up to a day. Keep the OVH zone untouched during that day.
7. **After 48 h on Cloudflare** (runbook step 7): enable DNSSEC in Cloudflare, copy the DS it shows into OVH Manager, then confirm with the step 1 loop that the `.pl` nameservers return the new DS and that step 5 shows the `ad` flag.

Never re-enable DNSSEC at OVH after step 2. A DS for OVH's key published while Cloudflare serves the zone would make the domain fail validation.

## Importing into Cloudflare

1. Add zone `zawlodzki.pl` in Cloudflare (Free plan is enough). Skip or delete the records the quick scan finds, so only the file's records exist.
2. DNS → Records → Import and Export → upload the private BIND file. Leave "Proxy imported DNS records" unticked.
3. Check that 24 records exist, then compare record by record against Cloudflare's assigned nameservers before the NS switch (runbook step 3). Pointing the tool at Cloudflare is a one-line change of `OVH_NS`, or a follow-up flag.

## Follow-ups

- Confirm in OVH Manager whether DNSSEC was turned off on 2026-10-21, and by whom.
- The `asv=` TXT owner is still unknown. It is kept.
- The Webflow verification TXT and the dropped OVH helpers can be removed for good after gate G5 (PLAN.md section 8 step 8).
