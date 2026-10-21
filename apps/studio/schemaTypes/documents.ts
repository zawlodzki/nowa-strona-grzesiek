import {defineArrayMember, defineField, defineType} from 'sanity'
import entities from '../../../migration/contracts/entities.json'
import {blockTypes} from './blocks'
import {languageField, slugField, titleField} from './objects'

export const page = defineType({
  name: 'page', title: 'Strona', type: 'document',
  fields: [languageField, titleField, slugField,
    defineField({name: 'seo', type: 'seo', validation: (rule) => rule.required()}),
    defineField({name: 'sections', title: 'Sekcje', type: 'array', of: blockTypes.map(({name}) => defineArrayMember({type: name})), validation: (rule) => rule.required().min(1).custom((sections) => {
      const emittingFaqs = sections?.filter((section) => typeof section === 'object' && section !== null && '_type' in section && section._type === 'faq' && (!('emitSchema' in section) || section.emitSchema !== false)) ?? []
      return emittingFaqs.length <= 1 || 'Tylko jeden blok FAQ na stronie może emitować dane strukturalne.'
    })}),
  ],
  preview: {select: {title: 'title', subtitle: 'language'}},
})
export const post = defineType({
  name: 'post', title: 'Wpis', type: 'document',
  fields: [languageField, titleField, slugField,
    defineField({name: 'excerpt', title: 'Zajawka', type: 'text', validation: (rule) => rule.required().max(320)}),
    defineField({name: 'body', title: 'Treść', type: 'portableText', validation: (rule) => rule.required().min(1)}),
    defineField({name: 'mainImage', title: 'Obraz główny', type: 'contentImage'}),
    defineField({name: 'thumbnail', title: 'Miniatura', type: 'contentImage'}),
    defineField({name: 'publishedAt', title: 'Data publikacji', type: 'datetime', validation: (rule) => rule.required()}),
    defineField({name: 'updatedAt', title: 'Data aktualizacji', type: 'datetime', validation: (rule) => rule.custom((value, context) => {
      const publishedAt = context.document?.publishedAt
      if (!value || typeof publishedAt !== 'string') return true
      return new Date(value) >= new Date(publishedAt) || 'Aktualizacja nie może poprzedzać publikacji.'
    })}),
    defineField({name: 'kind', title: 'Rodzaj', type: 'string', options: {list: ['blog', 'newsletter']}, initialValue: 'blog', validation: (rule) => rule.required().custom((value) => value === undefined || ['blog', 'newsletter'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'readingTime', title: 'Czas czytania w minutach', type: 'number', validation: (rule) => rule.integer().min(1)}),
    defineField({name: 'cta', type: 'link'}),
    defineField({name: 'faq', title: 'FAQ', type: 'array', of: [defineArrayMember({name: 'postFaqItem', type: 'object', fields: [
      defineField({name: 'q', title: 'Pytanie', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
      defineField({name: 'a', title: 'Odpowiedź', type: 'portableText', validation: (rule) => rule.required().min(1)}),
    ]})]}),
    defineField({name: 'schemaExtras', type: 'schemaExtras'}),
    defineField({name: 'seo', type: 'seo', validation: (rule) => rule.required()}),
  ],
  preview: {select: {title: 'title', subtitle: 'language', media: 'mainImage'}},
})
export const siteSettings = defineType({
  name: 'siteSettings', title: 'Ustawienia witryny', type: 'document',
  validation: (rule) => rule.custom(async (document, context) => {
    if (!document || typeof document.language !== 'string') return true
    const id = document._id.replace(/^drafts\./, '')
    const unique = await context.getClient({apiVersion: '2026-10-21'}).fetch<boolean>(
      '!defined(*[_type == "siteSettings" && language == $language && !(_id in [$id, $draftId])][0]._id)',
      {language: document.language, id, draftId: `drafts.${id}`},
    )
    return unique || 'Ustawienia dla tego języka już istnieją. Otwórz istniejący dokument.'
  }),
  fields: [languageField,
    defineField({name: 'nav', title: 'Nawigacja', type: 'array', of: [defineArrayMember({type: 'link'})], validation: (rule) => rule.required().min(1)}),
    defineField({name: 'footer', title: 'Stopka', type: 'array', of: [defineArrayMember({type: 'link'})], validation: (rule) => rule.required().min(1)}),
    defineField({name: 'defaultSeo', title: 'Domyślne SEO', type: 'seo', validation: (rule) => rule.required()}),
  ],
  preview: {select: {language: 'language'}, prepare: ({language}) => ({title: 'Ustawienia witryny', subtitle: language})},
})
export const person = defineType({
  name: 'person', title: 'Osoba', type: 'document',
  fields: [
    defineField({name: 'jsonldId', title: 'Identyfikator JSON-LD', type: 'url', initialValue: entities.person['@id'], readOnly: true, validation: (rule) => rule.required().custom((value) => value === undefined || [entities.person['@id']].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'name', title: 'Imię i nazwisko', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'jobTitle', title: 'Stanowisko', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Opis', type: 'text', validation: (rule) => rule.required()}),
    defineField({name: 'url', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https']})}),
    defineField({name: 'image', title: 'Zdjęcie', type: 'contentImage', validation: (rule) => rule.required()}),
    defineField({name: 'email', type: 'string', validation: (rule) => rule.email()}),
    defineField({name: 'telephone', type: 'string'}),
    defineField({name: 'worksFor', type: 'reference', to: [{type: 'organization'}]}),
    defineField({name: 'knowsLanguage', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'knowsAbout', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'sameAs', type: 'array', of: [defineArrayMember({type: 'url', validation: (rule) => rule.uri({scheme: ['https']})})]}),
  ], preview: {select: {title: 'name', media: 'image'}},
})
export const organization = defineType({
  name: 'organization', title: 'Organizacja', type: 'document',
  fields: [
    defineField({name: 'jsonldId', title: 'Identyfikator JSON-LD', type: 'url', initialValue: entities.organization['@id'], readOnly: true, validation: (rule) => rule.required().custom((value) => value === undefined || [entities.organization['@id']].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'legalName', title: 'Nazwa prawna', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'alternateName', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'description', type: 'text', validation: (rule) => rule.required()}),
    defineField({name: 'url', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https']})}),
    defineField({name: 'logo', type: 'contentImage', validation: (rule) => rule.required()}),
    defineField({name: 'foundingDate', type: 'date'}),
    defineField({name: 'vatID', type: 'string'}), defineField({name: 'taxID', type: 'string'}),
    defineField({name: 'identifier', type: 'array', of: [defineArrayMember({type: 'propertyValue'})]}),
    defineField({name: 'address', type: 'postalAddress'}),
    defineField({name: 'areaServed', type: 'string'}),
    defineField({name: 'knowsAbout', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'founder', type: 'reference', to: [{type: 'person'}]}),
    defineField({name: 'contactPoint', type: 'contactPoint'}),
    defineField({name: 'sameAs', type: 'array', of: [defineArrayMember({type: 'url', validation: (rule) => rule.uri({scheme: ['https']})})]}),
  ], preview: {select: {title: 'name', media: 'logo'}},
})
export const testimonial = defineType({
  name: 'testimonial', title: 'Rekomendacja', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Autor', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'role', title: 'Rola', type: 'string'}),
    defineField({name: 'company', title: 'Firma', type: 'string'}),
    defineField({name: 'quote', title: 'Cytat', type: 'text'}),
    defineField({name: 'image', title: 'Zrzut rekomendacji', type: 'contentImage'}),
    defineField({name: 'url', title: 'Źródło', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
  ],
  validation: (rule) => rule.custom((value) => !value || (typeof value.quote === 'string' && value.quote.trim().length > 0) || !!value.image || 'Dodaj cytat albo obraz rekomendacji.'),
  preview: {select: {title: 'name', subtitle: 'company', media: 'image'}},
})
export const logo = defineType({
  name: 'logo', title: 'Logo', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'image', title: 'Logo', type: 'contentImage', validation: (rule) => rule.required()}),
    defineField({name: 'url', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
    defineField({name: 'kind', type: 'string', options: {list: ['client', 'tool']}, validation: (rule) => rule.required().custom((value) => value === undefined || ['client', 'tool'].includes(value) || 'Wybierz dozwoloną wartość.')}),
  ], preview: {select: {title: 'name', media: 'image'}},
})
export const service = defineType({
  name: 'service', title: 'Usługa', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Nazwa', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'description', title: 'Opis', type: 'text', validation: (rule) => rule.required()}),
    defineField({name: 'serviceType', type: 'string'}),
    defineField({name: 'page', title: 'Strona usługi', type: 'reference', to: [{type: 'page'}]}),
    defineField({name: 'provider', type: 'reference', to: [{type: 'person'}, {type: 'organization'}]}),
    defineField({name: 'areaServed', type: 'string', initialValue: 'Polska'}),
  ], preview: {select: {title: 'name'}},
})
export const redirect = defineType({
  name: 'redirect', title: 'Przekierowanie', type: 'document',
  fields: [
    defineField({name: 'from', title: 'Ze ścieżki', type: 'string', validation: (rule) => rule.required().regex(/^\/(?!\/)[^\s?#]*$/)}),
    defineField({name: 'to', title: 'Do ścieżki', type: 'string', validation: (rule) => rule.required().regex(/^\/(?!\/)[^\s]*$/).custom((value, context) => !value || value !== context.document?.from || 'Cel musi różnić się od źródła.')}),
    defineField({name: 'status', title: 'Kod HTTP', type: 'number', initialValue: 301, options: {list: [301]}, validation: (rule) => rule.required().custom((value) => value === undefined || [301].includes(value) || 'Wybierz dozwoloną wartość.')}),
  ], preview: {select: {title: 'from', subtitle: 'to'}},
})
export const documentTypes = [page, post, siteSettings, person, organization, testimonial, logo, service, redirect]
export const singletonIds = {person: 'person', organization: 'organization'}
