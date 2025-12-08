import path from 'node:path';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

let __dirname = path.dirname(new URL(import.meta.url).pathname);
const isWindows = process.platform === 'win32';

if (isWindows && __dirname.startsWith('/'))
	__dirname = __dirname.slice(1);

export default [
	{
		ignores: ['dist/**', 'node_modules/**', '.git/**']
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: 'module',
				project: [path.join(__dirname, 'tsconfig.eslint.json')],
				tsconfigRootDir: __dirname,
			}
		},
		plugins: {
			'@typescript-eslint': tsPlugin,
			'simple-import-sort': simpleImportSort,
			import: importPlugin,
			prettier: prettierPlugin
		},
		settings: {
			'import/resolver': {
				typescript: {
					project: [path.join(__dirname, 'tsconfig.eslint.json')],
					alwaysTryTypes: true
				}
			}
		},
		linterOptions: {
			reportUnusedDisableDirectives: true
		},
		rules: {
			'prettier/prettier': 'warn',
			'simple-import-sort/imports': 'error',
			'simple-import-sort/exports': 'error',
			'import/no-duplicates': 'error',
			'no-console': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/explicit-function-return-type': 'off',
			indent: 'off'
		}
	},
	{
		files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: 'module'
		},
		rules: {
			'no-undef': 'off'
		}
	}
];