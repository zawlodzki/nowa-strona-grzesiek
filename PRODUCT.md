# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Owners, managing directors and sales leads at Polish B2B service and manufacturing companies with 2 to 500 employees. They sell through meetings and offers, already pay for a CRM or a stack of tools, and their team still moves work between those tools by hand. They come to the site to decide whether one consultant can fix the sales process, the CRM, the automations and the AI use together, and whether it is worth a call.

A second audience reads the blog: people comparing CRMs and project tools (Pipedrive, Asana, Salesforce and their alternatives), pricing, and practical how-tos. Most arrive from search and may not be buyers yet.

## Product Purpose

zawlodzki.pl is the site of Grzegorz Zawłodzki, a consultant and trainer who builds one working system for a B2B sales team out of process, CRM, automations and AI agents. The site sells his services and courses and publishes the blog and the weekly "Sales Atlas" newsletter.

Success is a booked free consultation (25 minutes online via cal.com, or the contact form). The newsletter signup is the second path for visitors who are not ready to talk.

## Positioning

One person connects the sales process, the CRM, the automations and the AI agents into a single system the team actually uses, and works with the team live (workshops and 1:1 training on their real deals). The same person runs the project from the first call to handover; it is not passed to another consultant after signing. Practice since 2022, more than 50 companies.

## Operating Context

- Services: AI in B2B sales (12-week program), Pipedrive training and implementation (authorized Pipedrive partner), Pipedrive automations, no-code process automation (n8n, Make, Zapier), Asana training and implementation, Salesforce implementation, Pipedrive CRM audit, Asana process audit, AI-in-sales audit (two weeks), sales audit.
- Method: Sales Atlas System, nine layers from diagnosis to measurement, each ending in a process, a CRM field, a report or a template.
- Courses and programs: AI in sales course, AI program for sales teams, partner program.
- Free materials: Pipedrive and Asana guides, a list of 22 apps tested in service businesses.
- Language: Polish first. English pages come later, after the Polish site passes gate G5.

## Capabilities and Constraints

- The site is being migrated from Webflow to Astro and Sanity on Cloudflare Workers. Design scope for the migration is refine, not redesign (`migration/PLAN.md`, section 10).
- Every indexable URL keeps its exact path. Forms post to the existing n8n webhook behind Turnstile. Consent runs through the self-hosted c15t loader.
- Marketing pages are Persuade surfaces. The blog and its posts are Read surfaces.
- Open: pricing shown on service pages is not confirmed as stable product truth; take it from the live page, never invent it.

## Brand Commitments

- Name: Grzegorz Zawłodzki. The operating company is Wellbiz sp. z o.o., Kraków.
- Voice: first person singular, direct, concrete, names real tools and real problems ("handlowiec robi za integrację"). No hype.
- Newsletter name: "Sales Atlas". Method name: "Sales Atlas System".
- Product animations (CRM pipeline, AI agent, automation) are an existing signature of the service sections.

## Evidence on Hand

- Client logos on the live site; named clients include IAB and Fundacja Pułaskiego.
- 50+ companies, teams of 2 to 500 people, practice since 2022, authorized Pipedrive partner.
- About 80 blog posts (`/blog/rss.xml`).
- Snapshot of every live page: `migration/00-inventory/live-site/html/` (private).
- No benchmark results, revenue figures or case-study numbers are confirmed for use. Do not fabricate testimonials or metrics.

## Product Principles

1. The visitor should see their own problem before the service: name the manual work the team does today.
2. Every claim rests on something real: a client, a number already on the site, a tool, a step of the method.
3. One clear next step per page, the free consultation, with the newsletter as the softer path.
4. Concrete over abstract: show the process, the pipeline, the agent's work, not generic illustrations.
5. Blog posts are for reading and finding answers; they sell only through the quality of the answer.
