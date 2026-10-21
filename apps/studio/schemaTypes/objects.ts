import {defineArrayMember, defineField, defineType} from 'sanity'
import registry from '../../../migration/contracts/blocks.json'

export const languageField = defineField({
  name: 'language', type: 'string', hidden: true, readOnly: true,
  initialValue: 'pl', options: {list: ['pl', 'en']},
  validation: (rule) => rule.required().custom((value) => value === undefined || ['pl', 'en'].includes(value) || 'Wybierz dozwoloną wartość.'),
})
export const titleField = defineField({
  name: 'title', title: 'Tytuł', type: 'string',
  validation: (rule) => rule.required().min(1).max(160).regex(/\S/),
})
export const headingField = defineField({
  name: 'heading', title: 'Nagłówek', type: 'string',
  validation: (rule) => rule.required().min(1).max(200).regex(/\S/),
})
export const taglineField = defineField({name: 'tagline', title: 'Nadtytuł', type: 'string'})
export const slugField = defineField({
  name: 'slug', type: 'slug', title: 'Ścieżka bez prefiksu języka',
  description: 'Pełna ścieżka, np. /, /o-mnie lub /blog/tytul. EN dostaje prefiks /en w witrynie.',
  options: {source: 'title', isUnique: async (slug, context) => {
    const document = context.document
    if (!document) return false
    const id = document._id.replace(/^drafts\./, '')
    return context.getClient({apiVersion: '2026-10-21'}).fetch<boolean>(
      '!defined(*[_type in ["page", "post"] && language == $language && slug.current == $slug && !(_id in [$id, $draftId])][0]._id)',
      {slug, language: document.language, id, draftId: `drafts.${id}`},
    )
  }, slugify: (input) => `/${input.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`},
  validation: (rule) => rule.required().custom((value) => {
    if (!value?.current) return true
    return /^(\/|\/[a-z0-9]+(?:[a-z0-9/-]*[a-z0-9])?)$/.test(value.current) && !value.current.includes('//') && !/^\/en(?:\/|$)/.test(value.current)
      || 'Użyj ścieżki małymi literami, bez końcowego ukośnika i prefiksu /en.'
  }),
})

export const contentImage = defineType({
  name: 'contentImage', title: 'Obraz', type: 'image', options: {hotspot: true},
  fields: [
    defineField({name: 'alt', title: 'Tekst alternatywny', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
    defineField({name: 'caption', title: 'Podpis', type: 'string'}),
  ],
  validation: (rule) => rule.custom((image) => !image || image.asset?._ref ? true : 'Wybierz plik obrazu.'),
})
export const link = defineType({
  name: 'link', title: 'Odnośnik', type: 'object',
  fields: [
    defineField({name: 'label', title: 'Etykieta', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
    defineField({name: 'href', title: 'Adres lub ścieżka', type: 'string', validation: (rule) => rule.required().custom((value) => {
      if (!value) return true
      return /^(\/(?!\/)[^\s]*|#[^\s]+|https?:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 -]+)$/.test(value) || 'Podaj ścieżkę /, kotwicę # albo adres HTTPS, mailto lub tel.'
    })}),
  ],
  preview: {select: {title: 'label', subtitle: 'href'}},
})
export const seo = defineType({
  name: 'seo', title: 'SEO', type: 'object',
  fields: [
    defineField({name: 'title', title: 'Tytuł SEO', type: 'string', validation: (rule) => rule.required().min(1).max(60).regex(/\S/)}),
    defineField({name: 'description', title: 'Opis SEO', type: 'text', rows: 3, validation: (rule) => rule.required().min(1).max(160).regex(/\S/)}),
    defineField({name: 'ogImage', title: 'Obraz udostępniania', type: 'contentImage'}),
    defineField({name: 'noindex', title: 'Wyklucz z indeksowania', type: 'boolean', initialValue: false}),
    defineField({name: 'canonicalOverride', title: 'Nadpisanie canonical', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
  ],
})
export const media = defineType({
  name: 'media', title: 'Media', type: 'object',
  fields: [
    defineField({name: 'kind', title: 'Rodzaj', type: 'string', options: {list: ['image', 'diagram'], layout: 'radio'}, validation: (rule) => rule.required().custom((value) => value === undefined || ['image', 'diagram'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'image', title: 'Obraz', type: 'contentImage', hidden: ({parent}) => parent?.kind !== 'image'}),
    defineField({name: 'key', title: 'Diagram', type: 'string', options: {list: registry.diagramKeys.keys}, hidden: ({parent}) => parent?.kind !== 'diagram', validation: (rule) => rule.custom((value) => value === undefined || registry.diagramKeys.keys.includes(value) || 'Wybierz dozwoloną wartość.')}),
  ],
  validation: (rule) => rule.custom((value) => {
    if (!value) return true
    if (value.kind === 'image') return !!value.image || 'Wybierz obraz.'
    if (value.kind === 'diagram') return typeof value.key === 'string' && registry.diagramKeys.keys.includes(value.key) || 'Wybierz diagram.'
    return 'Wybierz rodzaj mediów.'
  }),
})
export const faqItem = defineType({
  name: 'faqItem', title: 'Pytanie i odpowiedź', type: 'object',
  fields: [
    defineField({name: 'question', title: 'Pytanie', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
    defineField({name: 'answer', title: 'Odpowiedź', type: 'portableText', validation: (rule) => rule.required().min(1)}),
  ],
  preview: {select: {title: 'question'}},
})
export const postalAddress = defineType({
  name: 'postalAddress', title: 'Adres', type: 'object',
  fields: ['streetAddress', 'postalCode', 'addressLocality', 'addressCountry'].map((name) => defineField({name, type: 'string', validation: (rule) => rule.required()})),
})
export const propertyValue = defineType({
  name: 'propertyValue', title: 'Identyfikator rejestrowy', type: 'object',
  fields: [defineField({name: 'propertyID', type: 'string', validation: (rule) => rule.required()}), defineField({name: 'value', type: 'string', validation: (rule) => rule.required()})],
})
export const contactPoint = defineType({
  name: 'contactPoint', title: 'Dane kontaktowe', type: 'object',
  fields: [
    defineField({name: 'email', type: 'string', validation: (rule) => rule.email()}),
    defineField({name: 'telephone', type: 'string'}),
    defineField({name: 'contactType', type: 'string'}),
    defineField({name: 'availableLanguage', type: 'array', of: [defineArrayMember({type: 'string'})]}),
  ],
})
export const schemaExtras = defineType({
  name: 'schemaExtras', title: 'Dodatkowe dane strukturalne', type: 'object',
  fields: [
    defineField({name: 'softwareMentioned', title: 'Wspomniane aplikacje', type: 'array', of: [defineArrayMember({type: 'object', name: 'software', fields: [
      defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'url', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
      defineField({name: 'applicationCategory', type: 'string'}),
    ]})]}),
    defineField({name: 'itemList', title: 'Lista elementów', type: 'array', of: [defineArrayMember({type: 'object', name: 'listItem', fields: [
      defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'url', type: 'url', validation: (rule) => rule.uri({scheme: ['https']})}),
      defineField({name: 'description', type: 'text'}),
    ]})]}),
  ],
})
export const objectTypes = [contentImage, link, seo, media, faqItem, postalAddress, propertyValue, contactPoint, schemaExtras]
