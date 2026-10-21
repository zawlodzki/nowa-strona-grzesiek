import {blockTypes} from './blocks'
import {documentTypes} from './documents'
import {objectTypes} from './objects'
import {portableTextTypes} from './portable-text'

export {blockTypes} from './blocks'
export {documentTypes, singletonIds} from './documents'
export const schemaTypes = [...documentTypes, ...blockTypes, ...objectTypes, ...portableTextTypes]
