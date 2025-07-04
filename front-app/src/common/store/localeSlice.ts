import Language from '../utils/language'
import { type StateCreator } from 'zustand'
import config from '../utils/config'

export interface LocaleSlice {
	locale: Language
	setLocale: (newLocale: Language) => void
}

const getInitialLocale = (): Language => {
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem(config.localeKey)
		if (stored && Object.values(Language).includes(stored as Language)) {
			return stored as Language
		}
	}
	return config.localeDefault
}

const createLocaleSlice: StateCreator<LocaleSlice> = (set) => ({
	locale: getInitialLocale(),
	setLocale: (newLocale) => {
		localStorage.setItem(config.localeKey, newLocale)
		set({ locale: newLocale })
	},
})

export default createLocaleSlice
