import {defineArrayMember, defineField, defineType} from 'sanity'
import {headingField, taglineField, titleField} from './objects'

export const hero = defineType({
  name: 'hero', title: 'Hero', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['default', 'badge']}, initialValue: 'default', validation: (rule) => rule.required().custom((value) => value === undefined || ['default', 'badge'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField, headingField,
    defineField({name: 'body', type: 'text', validation: (rule) => rule.required()}),
    defineField({name: 'image', type: 'contentImage', validation: (rule) => rule.required()}),
    defineField({name: 'badges', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'cta', type: 'link'}),
  ], preview: {select: {title: 'heading', media: 'image'}},
})
export const logoStrip = defineType({
  name: 'logoStrip', title: 'Logotypy', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['clients', 'tools']}, initialValue: 'clients', validation: (rule) => rule.required().custom((value) => value === undefined || ['clients', 'tools'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'logos', type: 'array', of: [defineArrayMember({type: 'reference', to: [{type: 'logo'}]})], validation: (rule) => rule.required().min(1)}),
  ], preview: {select: {title: 'title'}},
})
export const feature = defineType({
  name: 'feature', title: 'Sekcja z mediami', type: 'object',
  fields: [taglineField, headingField,
    defineField({name: 'body', type: 'portableText', validation: (rule) => rule.required().min(1)}),
    defineField({name: 'bullets', type: 'array', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'media', type: 'media'}),
    defineField({name: 'mediaSide', type: 'string', options: {list: ['left', 'right']}, initialValue: 'right', validation: (rule) => rule.required().custom((value) => value === undefined || ['left', 'right'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'anchorId', type: 'slug', validation: (rule) => rule.custom((value) => !value?.current || /^[a-z][a-z0-9-]*$/.test(value.current) || 'Użyj identyfikatora bez # i spacji.')}),
    defineField({name: 'cta', type: 'link'}),
  ], preview: {select: {title: 'heading'}},
})
export const contentSection = defineType({
  name: 'contentSection', title: 'Lista lub karty', type: 'object',
  fields: [taglineField, headingField,
    defineField({name: 'intro', type: 'portableText'}),
    defineField({name: 'layout', type: 'string', options: {list: ['list', 'cards', 'twoColumn', 'checklist']}, initialValue: 'list', validation: (rule) => rule.required().custom((value) => value === undefined || ['list', 'cards', 'twoColumn', 'checklist'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'items', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'contentItem', type: 'object', fields: [
      titleField, defineField({name: 'text', type: 'text', validation: (rule) => rule.required()}),
      defineField({name: 'icon', type: 'string'}), defineField({name: 'link', type: 'link'}),
    ]})]}),
    defineField({name: 'media', type: 'media'}),
  ], preview: {select: {title: 'heading'}},
})
export const pricing = defineType({
  name: 'pricing', title: 'Cennik', type: 'object',
  fields: [taglineField, headingField,
    defineField({name: 'plans', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({name: 'pricePlan', type: 'object', fields: [
      defineField({name: 'name', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'price', type: 'number', validation: (rule) => rule.required().min(0)}),
      defineField({name: 'currency', type: 'string', initialValue: 'PLN', options: {list: ['PLN']}, validation: (rule) => rule.required().custom((value) => value === undefined || ['PLN'].includes(value) || 'Wybierz dozwoloną wartość.')}),
      defineField({name: 'unit', type: 'string', validation: (rule) => rule.required()}),
      defineField({name: 'priceNote', type: 'string'}),
      defineField({name: 'features', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (rule) => rule.required().min(1)}),
      defineField({name: 'cta', type: 'link', validation: (rule) => rule.required()}),
      defineField({name: 'highlighted', type: 'boolean', initialValue: false}),
    ]})]}),
  ], preview: {select: {title: 'heading'}},
})
export const ctaBand = defineType({name: 'ctaBand', title: 'Wezwanie do działania', type: 'object', fields: [headingField, defineField({name: 'body', type: 'text'}), defineField({name: 'cta', type: 'link', validation: (rule) => rule.required()})], preview: {select: {title: 'heading'}}})
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
export const contactForm = defineType({
  name: 'contactForm', title: 'Formularz kontaktowy', type: 'object',
  fields: [
    defineField({name: 'variant', type: 'string', options: {list: ['landing', 'full']}, initialValue: 'landing', validation: (rule) => rule.required().custom((value) => value === undefined || ['landing', 'full'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    taglineField, defineField({name: 'heading', type: 'string'}),
    defineField({name: 'showDetails', type: 'boolean', initialValue: false}),
    defineField({name: 'formId', type: 'string', options: {list: ['landing-contact', 'main-contact']}, validation: (rule) => rule.required().custom((value) => value === undefined || ['landing-contact', 'main-contact'].includes(value) || 'Wybierz dozwoloną wartość.')}),
  ], preview: {select: {title: 'heading'}},
})
export const newsletterSignup = defineType({name: 'newsletterSignup', title: 'Newsletter', type: 'object', fields: [defineField({name: 'body', type: 'text'})]})
export const richText = defineType({name: 'richText', title: 'Treść artykułu', type: 'object', fields: [defineField({name: 'body', type: 'portableText', validation: (rule) => rule.required().min(1)})]})
export const blockTypes = [hero, logoStrip, feature, contentSection, pricing, ctaBand, testimonials, promoCard, faq, contactForm, newsletterSignup, richText]
