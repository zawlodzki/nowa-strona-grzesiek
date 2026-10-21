// The n8n flow was built against Webflow's `form_submission` webhook, so the Worker
// sends the same envelope and the same field names, and the flow needs no change.
// https://developers.webflow.com/data/reference/webhooks/events/form-submission

export interface FormEnv {
  N8N_FORM_WEBHOOK: string;
  TURNSTILE_SECRET_KEY: string;
}

type FieldType = 'FormTextInput' | 'FormTextarea' | 'FormCheckboxInput';
type Field = readonly [name: string, type: FieldType];

const WEBFLOW_SITE_ID = '62e8050a7ce936c2cad0d6a1';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TURNSTILE_FIELD = 'cf-turnstile-response';

const ATTRIBUTION_FIELDS: readonly Field[] = [
  'first_touch_source',
  'first_touch_medium',
  'first_touch_campaign',
  'first_touch_content',
  'first_touch_landing_page',
  'first_touch_referrer_domain',
  'first_touch_timestamp',
  'last_touch_source',
  'last_touch_medium',
  'last_touch_campaign',
  'last_touch_content',
  'last_touch_landing_page',
  'last_touch_referrer_domain',
  'last_touch_timestamp',
  'utm_id',
  'utm_term',
  'previous_page',
  'current_page',
  'cta_id',
  'form_name',
  'session_page_count',
  'conversion_timestamp',
  'gclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'fbclid',
  'li_fat_id',
  'attribution_measurement_consent',
  'attribution_marketing_consent',
  'attribution_policy_id',
  'attribution_schema_version',
].map((name) => [name, 'FormTextInput'] as const);

const CONTACT_FIELDS: readonly Field[] = [
  ['email', 'FormTextInput'],
  ['phone', 'FormTextInput'],
  ['message', 'FormTextarea'],
  ['newsletter', 'FormCheckboxInput'],
  ['marketing-emails', 'FormCheckboxInput'],
  ...ATTRIBUTION_FIELDS,
];

const NEWSLETTER_FIELDS: readonly Field[] = [['email', 'FormTextInput'], ['newsletter', 'FormCheckboxInput'], ...ATTRIBUTION_FIELDS];

// Keys are the `formId` values in contracts/blocks.json. `name` is the Webflow form name n8n sees.
export const FORMS = {
  'main-contact': { name: 'main-contact-form', fields: CONTACT_FIELDS, redirect: '/podziekowanie-konsultacja' },
  'landing-contact': { name: 'Landing Contact Form', fields: CONTACT_FIELDS, redirect: '/podziekowanie-konsultacja' },
  newsletter: { name: 'Newsletter bottom CTA form', fields: NEWSLETTER_FIELDS, redirect: '/podziekowanie-newsletter' },
} as const satisfies Record<string, { name: string; fields: readonly Field[]; redirect: string }>;

type FormKey = keyof typeof FORMS;

function isFormKey(key: string | null): key is FormKey {
  return key !== null && Object.hasOwn(FORMS, key);
}

function text(status: number, body: string): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function turnstilePasses(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);
  const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body }).catch(() => null);
  if (!response?.ok) return false;
  const outcome: { success?: boolean } = await response.json();
  return outcome.success === true;
}

// Webflow sends every field of the form, hidden ones as "" when empty and checkboxes as "true"/"false".
export function webflowSubmission(key: FormKey, submitted: FormData, now: Date) {
  const form = FORMS[key];
  const data: Record<string, string> = {};
  for (const [name, type] of form.fields) {
    const value = submitted.get(name);
    data[name] = type === 'FormCheckboxInput' ? String(value !== null) : typeof value === 'string' ? value.trim() : '';
  }
  return {
    triggerType: 'form_submission',
    payload: {
      name: form.name,
      siteId: WEBFLOW_SITE_ID,
      data,
      schema: form.fields.map(([fieldName, fieldType]) => ({ fieldName, fieldType })),
      submittedAt: now.toISOString(),
      id: crypto.randomUUID().replaceAll('-', '').slice(0, 24),
    },
  };
}

export async function handleForm(request: Request, env: FormEnv): Promise<Response> {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const key = new URL(request.url).searchParams.get('form');
  if (!isFormKey(key)) return text(404, 'Nieznany formularz.');

  let submitted: FormData;
  try {
    submitted = await request.formData();
  } catch {
    return text(400, 'Nieprawidłowe dane formularza.');
  }

  const email = submitted.get('email');
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(email.trim())) return text(400, 'Podaj poprawny adres e-mail.');

  const token = submitted.get(TURNSTILE_FIELD);
  const human =
    typeof token === 'string' && token !== '' && (await turnstilePasses(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP')));
  if (!human) return text(403, 'Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie.');

  const forwarded = await fetch(env.N8N_FORM_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(webflowSubmission(key, submitted, new Date())),
  }).catch(() => null);
  if (!forwarded?.ok) return text(502, 'Nie udało się wysłać formularza. Spróbuj ponownie za chwilę.');

  return new Response(null, { status: 303, headers: { Location: FORMS[key].redirect, 'Cache-Control': 'no-store' } });
}
