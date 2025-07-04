import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { IntlProvider, type PrimitiveType, useIntl } from 'react-intl'
import { EventEmitter } from 'events'
import { type FormatXMLElementFn } from 'intl-messageformat'
import React from 'react'

export enum Language {
	en = 'en',
	fr = 'fr',
}

export interface I18nObject {
	[key: string]: string | I18nObject
}

type I18nKeyDiscriminator = { readonly $discriminator: unique symbol }
export type I18nKey = string & I18nKeyDiscriminator

type AvailableKeys<I extends I18nObject> = {
	[K in keyof I]: I[K] extends I18nObject ? AvailableKeys<I[K]> : I18nKey
}

export interface I18nConfig<K extends I18nObject> {
	en: K
	fr: { [key in keyof K]: K[key] }
}

type FlatI18nObject = { [key: string]: string }

export type FlatI18nConfig = { [lang in Language]: FlatI18nObject }

const emptyFlatI18nConfig = Object.values(Language).reduce(
	(langAcc, lang) => ({ ...langAcc, [lang]: {} }),
	{},
) as FlatI18nConfig

function flattenAndGenerateKeys<K extends I18nObject>(
	messages: I18nConfig<K>,
	prefix: string = '',
): {
	i18nConfig: FlatI18nConfig
	keys: AvailableKeys<K>
} {
	return Object.keys(messages.en).reduce(
		(acc, key) => {
			const fullKey = `${prefix}.${key}`
			if (typeof messages.en[key] === 'string') {
				return {
					i18nConfig: Object.values(Language).reduce(
						(langAcc, lang) => ({
							...langAcc,
							[lang]: {
								...acc.i18nConfig[lang],
								[fullKey]: messages[lang]?.[key],
							},
						}),
						{},
					) as FlatI18nConfig,
					keys: {
						...acc.keys,
						[key]: fullKey,
					},
				}
			} else {
				const childConfig = Object.values(Language).reduce(
					(langAcc, lang) => ({
						...langAcc,
						[lang]: messages[lang]?.[key] as I18nObject,
					}),
					{},
				) as I18nConfig<I18nObject>

				const child = flattenAndGenerateKeys(childConfig, fullKey)
				return {
					i18nConfig: Object.values(Language).reduce(
						(langAcc, lang) => ({
							...langAcc,
							[lang]: {
								...acc.i18nConfig[lang],
								...child.i18nConfig[lang],
							},
						}),
						{},
					) as FlatI18nConfig,
					keys: {
						...acc.keys,
						[key]: child.keys,
					},
				}
			}
		},
		{
			i18nConfig: emptyFlatI18nConfig,
			keys: {} as AvailableKeys<K>,
		},
	)
}

let i18nKeys: FlatI18nConfig = emptyFlatI18nConfig

const EventBus = new EventEmitter()

let counter = 0

const eventName = 'i18nKeysChanged'

export function defineI18n<K extends I18nObject>(
	newMessages: I18nConfig<K>,
): AvailableKeys<K> {
	const prefix = (++counter).toString(16)

	const { i18nConfig, keys } = flattenAndGenerateKeys(newMessages, prefix)

	i18nKeys = Object.values(Language).reduce(
		(acc, lang) => ({
			...acc,
			[lang]: {
				...acc[lang],
				...i18nConfig[lang],
			},
		}),
		i18nKeys,
	)

	EventBus.emit(eventName)

	return keys
}

export type Translate<K extends string = string> = {
	(key: K, values?: Record<string, PrimitiveType>): string
	(
		key: K,
		values?: Record<
			string,
			PrimitiveType | React.ReactElement | FormatXMLElementFn<string, any>
		>,
	): string | ReactNode[]
}
export function useTranslate(): Translate<I18nKey> {
	const intl = useIntl()

	const translate = useCallback(
		(key: string, params?: Record<string, PrimitiveType>) => {
			return intl.formatMessage({ id: key }, params)
		},
		[intl],
	)

	return translate as Translate<I18nKey>
}

interface I18nProviderProps {
	children?: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
	const [localKeys, setKeys] = useState<FlatI18nConfig>(i18nKeys)

	useEffect(() => {
		setKeys(i18nKeys)
		const onMessagesChanged = () => setKeys(i18nKeys)
		EventBus.on(eventName, onMessagesChanged)
		return () => {
			EventBus.off(eventName, onMessagesChanged)
		}
	}, [])

	const locale = 'en' // TODO selectable

	return (
		<IntlProvider
			locale={locale}
			defaultLocale="en"
			messages={localKeys[locale]}
		>
			{children}
		</IntlProvider>
	)
}
