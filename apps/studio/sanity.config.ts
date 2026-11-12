import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {documentInternationalization} from '@sanity/document-internationalization'
import {media} from 'sanity-plugin-media'
import {tableOfContentsPlugin} from 'sanity-plugin-table-of-contents'
import {presentation} from './presentation'
import {schemaTypes, singletonIds} from './schemaTypes'

const localizedTypes = ['page', 'post', 'siteSettings']
const singletonTypes = Object.keys(singletonIds)
const legalSlugs = [
  '/polityka-prywatnosci',
  '/regulamin',
  '/regulamin-newslettera',
  '/lista-cookies-i-identyfikatorow',
]

export default defineConfig({
  name: 'zawlodzki',
  title: 'zawlodzki.pl',
  projectId: '8u2zjhvn',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    presentation,
    media(),
    tableOfContentsPlugin({
      fieldNames: ['sections', 'body'],
      documentTypes: ['page', 'post'],
    }),
    structureTool({
      structure: (S) => S.list().title('Treści').items([
        ...singletonTypes.map((type) => S.listItem()
          .title(type === 'person' ? 'Grzegorz Zawłodzki' : 'Wellbiz')
          .id(type)
          .child(S.document().schemaType(type).documentId(type))),
        S.documentTypeListItem('page')
          .title('Strony')
          .child(S.documentTypeList('page').title('Strony')
            .filter('_type == "page" && !(slug.current in $legalSlugs)')
            .params({legalSlugs})),
        S.listItem()
          .id('legalPages')
          .title('Strony prawne')
          .child(S.documentTypeList('page').title('Strony prawne')
            .filter('_type == "page" && slug.current in $legalSlugs')
            .params({legalSlugs})),
        ...S.documentTypeListItems().filter((item) =>
          !singletonTypes.includes(item.getId() ?? '') &&
          !['page', 'translation.metadata'].includes(item.getId() ?? '')),
      ]),
    }),
    documentInternationalization({
      supportedLanguages: [{id: 'pl', title: 'Polski'}, {id: 'en', title: 'English'}],
      schemaTypes: localizedTypes,
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: (templates) => [
      ...templates.filter((template) =>
        !localizedTypes.includes(template.schemaType) && !singletonTypes.includes(template.schemaType)),
      ...localizedTypes.map((schemaType) => ({
        id: `${schemaType}-pl`, title: `${schemaType} (PL)`, schemaType,
        value: {language: 'pl'},
      })),
    ],
  },
  document: {
    newDocumentOptions: (options) => options.filter((option) =>
      !singletonTypes.includes(option.templateId) && option.templateId !== 'translation.metadata'),
    actions: (actions, context) =>
      [...singletonTypes, 'siteSettings'].includes(context.schemaType)
        ? actions.filter((action) => action.action !== 'duplicate' &&
            (context.schemaType === 'siteSettings' || action.action !== 'delete'))
        : actions,
  },
})
