import { useMutation } from '@tanstack/react-query'
import { generateFetchApi } from './queries'
import type Language from '../utils/language'

const updateLocale = generateFetchApi<[Language], void>(
	'/user/locale',
	(locale) => ({
		method: 'POST',
		body: JSON.stringify({ locale: locale.toUpperCase() }),
	}),
)

export const useUpdateLocale = () => {
	return useMutation({
		mutationFn: updateLocale,
	})
}
