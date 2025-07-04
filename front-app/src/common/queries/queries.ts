import { QueryClient } from '@tanstack/react-query'
import config from '../utils/config'

export const queryClient = new QueryClient()

export const fetchApi = (url: string, options?: RequestInit) => {
	return fetch(`${config.apiUrl}${url}`, {
		credentials: 'include',
		headers:
			options?.body != null
				? {
						'Content-Type': 'application/json',
				  }
				: {},
		...options,
	})
}
