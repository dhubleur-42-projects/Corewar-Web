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

	if (error instanceof HttpError && error.getError() != null) {
		toast.error(error.getError())
		return
	}

	if (error instanceof HttpError && error.status >= 500) {
		toast.error('An error occurred while processing your request')
		return
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
	private error?: string
	constructor(public status: number, message: string, error?: string) {
		super(message)
		this.name = 'HttpError'
		this.error = error
	}

	getError() {
		return this.error
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
				`Error ${response.status}`,
				response.headers.get('Content-Type')?.includes('application/json')
					? (await response.json()).error
					: undefined,
			)
		}
		return response.json() as Promise<T>
	}
}
