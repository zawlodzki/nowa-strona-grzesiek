import {defineArrayMember, defineField, defineType} from 'sanity'
import registry from '../../../migration/contracts/blocks.json'
import {contentImage} from './objects'

export const table = defineType({
  name: 'table', title: 'Tabela', type: 'object',
  fields: [
    defineField({name: 'hasHeader', title: 'Pierwszy wiersz jest nagłówkiem', type: 'boolean', initialValue: true}),
    defineField({name: 'rows', title: 'Wiersze', type: 'array', validation: (rule) => rule.required().min(1), of: [defineArrayMember({
      name: 'tableRow', type: 'object', fields: [defineField({name: 'cells', title: 'Komórki', type: 'array', of: [defineArrayMember({type: 'string'})], validation: (rule) => rule.required().min(1)})],
    })]}),
  ],
})
export const codeBlock = defineType({
  name: 'codeBlock', title: 'Kod', type: 'object',
  fields: [
    defineField({name: 'language', title: 'Język', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'code', title: 'Kod', type: 'text', validation: (rule) => rule.required()}),
  ],
})
export const embed = defineType({
  name: 'embed', title: 'Osadzenie', type: 'object',
  fields: [
    defineField({name: 'kind', title: 'Rodzaj', type: 'string', options: {list: ['youtube', 'loom', 'iframe']}, validation: (rule) => rule.required().custom((value) => value === undefined || ['youtube', 'loom', 'iframe'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'url', title: 'Adres', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https']})}),
    defineField({name: 'title', title: 'Tytuł osadzenia', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
  ],
})
export const download = defineType({
  name: 'download', title: 'Plik do pobrania', type: 'object',
  fields: [
    defineField({name: 'label', title: 'Etykieta', type: 'string', validation: (rule) => rule.required().regex(/\S/)}),
    defineField({name: 'url', title: 'Adres pliku', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https']}).custom((value) => {
      if (!value) return true
      try { return new URL(value).hostname === 'files.zawlodzki.com' || 'Plik musi być na files.zawlodzki.com.' }
      catch { return 'Podaj poprawny adres HTTPS.' }
    })}),
  ],
})
export const callout = defineType({
  name: 'callout', title: 'Wyróżnienie', type: 'object',
  fields: [
    defineField({name: 'tone', title: 'Rodzaj', type: 'string', options: {list: ['info', 'warning']}, initialValue: 'info', validation: (rule) => rule.required().custom((value) => value === undefined || ['info', 'warning'].includes(value) || 'Wybierz dozwoloną wartość.')}),
    defineField({name: 'body', title: 'Treść', type: 'text', validation: (rule) => rule.required().regex(/\S/)}),
  ],
})
export const portableText = defineType({
  name: 'portableText', title: 'Treść', type: 'array',
  of: [
    defineArrayMember({
      type: 'block', styles: registry.portableText.styles.map((value) => ({title: value, value})),
      lists: [{title: 'Punktowana', value: 'bullet'}, {title: 'Numerowana', value: 'number'}],
      marks: {
        decorators: ['strong', 'em', 'code'].map((value) => ({title: value, value})),
        annotations: [
          defineArrayMember({name: 'link', type: 'object', title: 'Link zewnętrzny', fields: [defineField({name: 'href', type: 'url', validation: (rule) => rule.required().uri({scheme: ['https', 'http', 'mailto', 'tel']})})]}),
          defineArrayMember({name: 'internalLink', type: 'object', title: 'Link wewnętrzny', fields: [defineField({name: 'reference', type: 'reference', to: [{type: 'page'}, {type: 'post'}], validation: (rule) => rule.required()})]}),
        ],
      },
    }),
    defineArrayMember({type: 'image', options: contentImage.options, fields: contentImage.fields, validation: contentImage.validation}),
    ...[table, codeBlock, embed, download, callout].map(({name}) => defineArrayMember({type: name})),
  ],
})
export const portableTextTypes = [table, codeBlock, embed, download, callout, portableText]
