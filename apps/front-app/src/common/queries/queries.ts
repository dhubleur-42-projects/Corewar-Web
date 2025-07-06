import { QueryClient } from '@tanstack/react-query'
import config from '../utils/config'
import { toast } from 'react-toastify'

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 0,
			throwOnError: false,
		},
		mutations: {
			retry: 0,
			throwOnError: false,
		},
	},
})

const handleError = (error: unknown) => {
	if (error instanceof Error && error.message.includes('Failed to fetch')) {
		toast.error('Unable to connect to the server')
		return
	}

	if (error instanceof HttpError && error.status >= 500) {
		toast.error('An error occurred while fetching data')
	}
}

queryClient.getQueryCache().subscribe((event) => {
	if (event.type === 'updated') {
		const query = event.query
		const error = query.state.error

		handleError(error)
	}
})
queryClient.getMutationCache().subscribe((event) => {
	if (event.type === 'updated') {
		const query = event.mutation
		const error = query.state.error

		handleError(error)
	}
})

const fetchApi = (url: string, options?: RequestInit) => {
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

type FetchApiOptions = RequestInit | ((...args: any[]) => RequestInit)

class HttpError extends Error {
	constructor(public status: number, message: string) {
		super(message)
		this.name = 'HttpError'
	}
}

export const generateFetchApi = <Args extends any[], T>(
	url: string,
	options?: FetchApiOptions,
): ((...args: Args) => Promise<T>) => {
	return async (...args: Args): Promise<T> => {
		const requestOptions =
			typeof options === 'function' ? options(...args) : options

		const response = await fetchApi(url, requestOptions)
		if (!response.ok) {
			throw new HttpError(
				response.status,
				`Erreur HTTP ${response.status}`,
			)
		}
		return response.json() as Promise<T>
	}
}
