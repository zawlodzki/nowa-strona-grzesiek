import { readFile, writeFile } from 'node:fs/promises';

// Offline only. Emits a revision-guarded proposal; never submits mutations.
// Input: JSON result of `*[_type in ["service","page"]]{_id,_rev,_type,name,course,page,slug}` on the target dataset.
if (!process.argv[2]) throw new Error('Usage: node service-t47-course-patch.mjs export.json [report.json]');
const parsed = JSON.parse(await readFile(process.argv[2], 'utf8'));
const docs = Array.isArray(parsed) ? parsed : parsed.result;
if (!Array.isArray(docs)) throw new Error('Expected documents or a query result');
const PATH = '/kurs-ai-w-sprzedazy';
const pages = docs.filter(d => d._type === 'page' && d.slug?.current === PATH && !d._id.startsWith('drafts.'));
if (pages.length !== 1) throw new Error(`Expected exactly one published page at ${PATH}`);
const services = docs.filter(d => d._type === 'service' && d.page?._ref === pages[0]._id && !d._id.startsWith('drafts.'));
if (services.length !== 1) throw new Error('Expected exactly one published service for the course page');
const doc = services[0];
if (!doc._rev) throw new Error('Missing revision');

// Values of the Course node the Webflow page published, minus `termsOfService` (not a Course property).
const course = {
  educationalLevel: 'Średnio zaawansowany',
  isAccessibleForFree: false,
  audience: 'Firmy B2B prowadzące sprzedaż doradczą',
  teaches: [
    'Proces sprzedaży pod AI — mapa procesu i scoring, gdzie AI zarobi',
    'Kontekst, integracje i ontologia — repozytorium kontekstu firmy i podpięcie systemów przez MCP, REST i CLI',
    'Pierwszy skill w Claude albo ChatGPT — budowa, testy i poprawianie',
    'Automatyzacje CRM i porządek w danych — audyt, higiena, dwie automatyzacje',
    'Bazy prospectingowe — ICP jako filtry, dane z KRS, CEIDG i REGON',
    'Transkrypcje jako materiał do sprzedaży — obieg do CRM, bank języka klienta, RODO i AI Act',
    'Oferta jako interaktywna strona zamiast PDF-a',
    'Wdrożenie w zespole — opiekun procesu, mierniki, polityka użycia AI',
    'Bonus: audyt strony usługowej i landingu pod widoczność w Google i w odpowiedziach AI oraz pisanie artykułów na podstawie żywych wyników wyszukiwania',
    'Bonus: system produkcji treści na bloga, LinkedIna i X wraz z karuzelami',
  ],
  instance: { name: 'Kurs AI w sprzedaży B2B — dostęp na rok', courseMode: 'online', courseWorkload: 'PT9H', startDate: '2026-10-01' },
};

const same = JSON.stringify(doc.course) === JSON.stringify(course);
if (doc.course && !same) throw new Error('Existing course fields conflict with the proposal');
const report = {
  dryRun: true, applied: false, document: doc._id, revision: doc._rev, serviceName: doc.name,
  finding: same ? 'Course fields already match. No patch proposed.' : 'Proposal only. Human approval required before any write.',
  changes: same ? [] : [{ path: 'course', before: null, after: course }],
  mutations: same ? [] : [{ patch: { id: doc._id, ifRevisionID: doc._rev, set: { course } } }],
};
const output = JSON.stringify(report, null, 2) + '\n';
if (process.argv[3]) await writeFile(process.argv[3], output); else process.stdout.write(output);
