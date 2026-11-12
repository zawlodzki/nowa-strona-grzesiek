import {defineArrayMember, defineField, defineType} from 'sanity'
import {headingField, taglineField, titleField} from './objects'

const optionalHeading = defineField({name: 'heading', title: 'Nagłówek', type: 'string', validation: (rule) => rule.max(200)})

export const hero = defineType({
  name: 'hero', title: 'Hero', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['default', 'badge']}, initialValue: 'default', validation: (rule) => rule.required().custom((value) => value === undefined || ['default', 'badge'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField, headingField,
    defineField({name: 'body', type: 'text', validation: (rule) => rule.required()}),
    defineField({name: 'image', type: 'contentImage', validation: (rule) => rule.required()}),
    defineField({name: 'badgeImage', type: 'contentImage'}),
    defineField({name: 'badgeSize', type: 'string', options: {list: ['standard', 'wide']}}),
    defineField({name: 'badges', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'cta', type: 'link'}),
  ], preview: {select: {title: 'heading', media: 'image'}},
})
export const logoStrip = defineType({
  name: 'logoStrip', title: 'Logotypy', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['clients', 'tools']}, initialValue: 'clients', validation: (rule) => rule.required().custom((value) => value === undefined || ['clients', 'tools'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField,
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'intro', title: 'Wstęp', description: 'Jedno zdanie pod tytułem albo, w wariancie tools, podpis nad logotypami.', type: 'text', rows: 2}),
    defineField({name: 'logos', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'logo'}]})], validation: (rule) => rule.required().min(1)}),
  ], preview: {select: {title: 'title', subtitle: 'intro'}},
})
export const feature = defineType({
  name: 'feature', title: 'Sekcja z mediami', type: 'object',
  fields: [taglineField, headingField,
    defineField({name: 'layout', type: 'string', options: {list: ['default', 'article']}, validation: (rule) => rule.custom((value) => !value || ['default', 'article'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'body', type: 'portableText', validation: (rule) => rule.required().min(1)}),
    defineField({name: 'bullets', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'media', type: 'media'}),
    defineField({name: 'mediaCaption', type: 'text', rows: 2}),
    defineField({name: 'mediaSide', type: 'string', options: {list: ['left', 'right']}, initialValue: 'right', validation: (rule) => rule.required().custom((value) => value === undefined || ['left', 'right'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'anchorId', type: 'slug', validation: (rule) => rule.custom((value) => !value?.current || /^[a-z][a-z0-9-]*$/.test(value.current) || 'Użyj identyfikatora bez # i spacji.')}),
    defineField({name: 'cta', type: 'link'}),
  ], preview: {select: {title: 'heading'}},
})
export const contentSection = defineType({
  name: 'contentSection', title: 'Lista lub karty', type: 'object',
  fields: [taglineField, optionalHeading,
    defineField({name: 'intro', type: 'portableText'}),
    defineField({name: 'layout', type: 'string', options: {list: ['list', 'cards', 'twoColumn', 'checklist']}, initialValue: 'list', validation: (rule) => rule.required().custom((value) => value === undefined || ['list', 'cards', 'twoColumn', 'checklist'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'items', type: 'array', of: [defineArrayMember({name: 'contentItem', type: 'object', fields: [
      defineField({...titleField, validation: (rule) => rule.required().min(1).max(200).regex(/\S/)}),
      defineField({name: 'text', type: 'text'}),
      defineField({name: 'icon', type: 'string'}), defineField({name: 'link', type: 'link'}),
    ]})]}),
    defineField({name: 'media', type: 'media'}),
  ], preview: {select: {title: 'heading'}},
})
export const tabs = defineType({
  name: 'tabs', title: 'Zakładki', type: 'object',
  fields: [taglineField, defineField({name: 'heading', type: 'string'}), defineField({name: 'intro', type: 'portableText'}),
    defineField({name: 'items', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'tabItem', type: 'object', fields: [
      titleField, defineField({name: 'summary', type: 'text'}), taglineField,
      defineField({name: 'positive', type: 'portableText'}), defineField({name: 'negative', type: 'portableText'}),
      defineField({name: 'body', type: 'portableText', validation: (rule) => rule.required().min(1)}),
      defineField({name: 'primaryCta', title: 'Główne CTA (opcjonalne)', type: 'link'}),
      defineField({name: 'secondaryCta', title: 'Dodatkowe CTA (opcjonalne)', type: 'link'}),
    ]})]}),
  ], preview: {select: {title: 'heading'}},
})
export const pricing = defineType({
  name: 'pricing', title: 'Cennik', type: 'object',
  fields: [taglineField, headingField,
    defineField({name: 'plans', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'pricePlan', type: 'object', fields: [
      defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'price', type: 'number', validation: (rule) => rule.min(0)}),
      defineField({name: 'currency', type: 'string', initialValue: 'PLN', options: {list: ['PLN']}, validation: (rule) => rule.required().custom((value) => value === undefined || ['PLN'].includes(value) || 'Wybierz dozwoloną wartość.')}),
      defineField({name: 'unit', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'priceNote', type: 'string'}),
      defineField({name: 'features', type: 'array', of: [defineArrayMember({type: 'string'})]}),
      defineField({name: 'cta', type: 'link', validation: (rule) => rule.required()}),
      defineField({name: 'highlighted', type: 'boolean', initialValue: false}),
    ]})]}),
  ], preview: {select: {title: 'heading'}},
})
export const ctaBand = defineType({name: 'ctaBand', title: 'Wezwanie do działania', type: 'object', fields: [optionalHeading, defineField({name: 'body', type: 'text'}), defineField({name: 'cta', type: 'link', validation: (rule) => rule.required()})], preview: {select: {title: 'heading'}}})
export const testimonials = defineType({
  name: 'testimonials', title: 'Rekomendacje', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['quotes', 'imageWall']}, initialValue: 'quotes', validation: (rule) => rule.required().custom((value) => value === undefined || ['quotes', 'imageWall'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField, defineField({name: 'heading', type: 'string'}),
    defineField({name: 'items', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'testimonial'}]})], validation: (rule) => rule.required().min(1)}),
  ], preview: {select: {title: 'heading'}},
})
export const promoCard = defineType({name: 'promoCard', title: 'Polecana strona', type: 'object', fields: [titleField, defineField({name: 'points', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (rule) => rule.required().min(1)}), defineField({name: 'target', type: 'reference', to: [{type: 'page'}], validation: (rule) => rule.required()})], preview: {select: {title: 'title'}}})
export const faq = defineType({name: 'faq', title: 'FAQ', type: 'object', fields: [taglineField, headingField, defineField({name: 'items', type: 'array', of: [defineArrayMember({type: 'faqItem'})], validation: (rule) => rule.required().min(1)}), defineField({name: 'emitSchema', type: 'boolean', initialValue: true})], preview: {select: {title: 'heading'}}})
const fullOnly = ({parent}: {parent?: {variant?: string}}) => parent?.variant !== 'full'
export const channelKinds = ['linkedin', 'github', 'x', 'youtube', 'instagram', 'email', 'phone', 'signal', 'whatsapp']
export const contactForm = defineType({
  name: 'contactForm', title: 'Formularz kontaktowy', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['landing', 'full', 'channels']}, initialValue: 'landing', validation: (rule) => rule.required().custom((value) => value === undefined || ['landing', 'full', 'channels'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField, defineField({name: 'heading', type: 'string'}),
    defineField({name: 'intro', title: 'Wstęp', description: 'Tekst pod nagłówkiem. Nowa linia zostaje zachowana.', type: 'text', rows: 3}),
    defineField({name: 'showDetails', type: 'boolean', initialValue: false}),
    defineField({name: 'calendar', title: 'Kalendarz', type: 'object', hidden: fullOnly, fields: [
      defineField({name: 'heading', title: 'Nagłówek', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
      defineField({name: 'text', title: 'Tekst przed odnośnikiem', type: 'text', rows: 2}),
      defineField({name: 'link', type: 'link', validation: (rule) => rule.required()}),
    ]}),
    defineField({name: 'consultation', title: 'Jak działa konsultacja', type: 'object', hidden: fullOnly, fields: [
      defineField({name: 'heading', title: 'Nagłówek', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
      defineField({name: 'body', title: 'Treść', description: 'Nowa linia zostaje zachowana.', type: 'text', rows: 4, validation: (rule) => rule.required().regex(/\S/)}),
    ]}),
    defineField({name: 'channels', title: 'Kanały kontaktu', type: 'object', hidden: ({parent}) => !['full', 'channels'].includes(parent?.variant), fields: [
      taglineField, defineField({name: 'heading', title: 'Nagłówek', type: 'string'}),
      defineField({name: 'groups', title: 'Grupy', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'contactChannelGroup', type: 'object', fields: [
        titleField, defineField({name: 'note', title: 'Opis', type: 'text', rows: 2}),
        defineField({name: 'items', title: 'Kanały', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'contactChannel', type: 'object', fields: [
          defineField({name: 'kind', title: 'Rodzaj', type: 'string', options: {list: channelKinds}, validation: (rule) => rule.required().custom((value) => value === undefined || channelKinds.includes(value) || 'Wybierz dozwoloną wartość.')}),
          defineField({name: 'label', title: 'Etykieta', description: 'Tekst widoczny przy e-mailu, telefonie i komunikatorach. Przy serwisach społecznościowych staje się nazwą dostępną ikony.', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
          defineField({name: 'href', title: 'Adres', type: 'string', validation: (rule) => rule.required().custom((value) => !value || /^(https:\/\/[^\s]+|mailto:[^\s]+|tel:\+?[0-9 -]+)$/.test(value) || 'Podaj adres HTTPS, mailto lub tel.')}),
        ], preview: {select: {title: 'label', subtitle: 'kind'}}})]}),
      ], preview: {select: {title: 'title', subtitle: 'note'}}})]}),
    ]}),
    defineField({name: 'formId', type: 'string', hidden: ({parent}) => parent?.variant === 'channels', options: {list: ['landing-contact', 'main-contact']}, validation: (rule) => rule.custom((value, context) => (context.parent as {variant?: string})?.variant === 'channels' || !!value || 'Wybierz formularz.').custom((value) => value === undefined || ['landing-contact', 'main-contact'].includes(value) || 'Wybierz dozwoloną wartość.')}),
  ], preview: {select: {title: 'heading'}},
})
export const newsletterSignup = defineType({name: 'newsletterSignup', title: 'Newsletter', type: 'object', fields: [defineField({name: 'body', type: 'text'})]})
export const postList = defineType({
  name: 'postList', title: 'Ostatnie wpisy', type: 'object',
  fields: [
    taglineField, defineField({name: 'heading', title: 'Nagłówek', type: 'string'}),
    defineField({name: 'kind', title: 'Rodzaj wpisów', type: 'string', options: {list: ['blog', 'newsletter']}, initialValue: 'blog', validation: (rule) => rule.required().custom((value) => value === undefined || ['blog', 'newsletter'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'limit', title: 'Liczba wpisów', type: 'number', initialValue: 3, validation: (rule) => rule.required().integer().min(1).max(12)}),
  ], preview: {select: {title: 'heading', subtitle: 'kind'}},
})
export const richText = defineType({name: 'richText', title: 'Treść artykułu', type: 'object', fields: [defineField({name: 'body', type: 'portableText', validation: (rule) => rule.required().min(1)})]})
export const blockTypes = [hero, logoStrip, feature, contentSection, tabs, pricing, ctaBand, testimonials, promoCard, faq, contactForm, newsletterSignup, postList, richText]
