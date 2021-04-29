import { renameKeysWith } from '@meltwater/phi'
import { camelCase, pascalCase } from 'change-case'

export const keysToCamelCase = renameKeysWith(camelCase)

export const keysToPascalCase = renameKeysWith(pascalCase)
