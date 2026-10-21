import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {documentInternationalization} from '@sanity/document-internationalization'
import {schemaTypes, singletonIds} from './schemaTypes'

const localizedTypes = ['page', 'post', 'siteSettings']
const singletonTypes = Object.keys(singletonIds)

export default defineConfig({
  name: 'zawlodzki',
  title: 'zawlodzki.pl',
  projectId: '8u2zjhvn',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({
      structure: (S) => S.list().title('Treści').items([
        ...singletonTypes.map((type) => S.listItem()
          .title(type === 'person' ? 'Grzegorz Zawłodzki' : 'Wellbiz')
          .id(type)
          .child(S.document().schemaType(type).documentId(type))),
        ...S.documentTypeListItems().filter((item) =>
          !singletonTypes.includes(item.getId() ?? '') && item.getId() !== 'translation.metadata'),
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
