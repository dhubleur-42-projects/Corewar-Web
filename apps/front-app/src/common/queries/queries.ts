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

	if (error instanceof HttpError && error.isTreated()) {
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

const fetchApi = (url: string, options?: RequestInit, contentType?: string) => {
	return fetch(`${config.apiUrl}${url}`, {
		credentials: 'include',
		headers:
			options?.body != null && contentType != 'multipart/form-data'
				? {
						'Content-Type': contentType ?? 'application/json',
					}
				: {},
		...options,
	})
}

export class HttpError extends Error {
	private error?: string
	private treated = false
	constructor(
		public status: number,
		message: string,
		error?: string,
	) {
		super(message)
		this.name = 'HttpError'
		this.error = error
	}

	getError() {
		return this.error
	}

	isTreated() {
		return this.treated
	}

	setTreated() {
		this.treated = true
	}
}

type FetchApiOptions<TVariables> =
	| RequestInit
	| ((variables: TVariables) => RequestInit)

export const generateFetchApi = <TVariables = void, TResponse = unknown>(
	url: string,
	options?: FetchApiOptions<TVariables>,
	contentType?: string,
): ((
	variables: TVariables extends void ? void : TVariables,
) => Promise<TResponse>) => {
	return async (variables: any): Promise<TResponse> => {
		const requestOptions =
			typeof options === 'function' ? options(variables) : options

		const response = await fetchApi(url, requestOptions, contentType)
		if (!response.ok) {
			throw new HttpError(
				response.status,
				`Error ${response.status}`,
				response.headers
					.get('Content-Type')
					?.includes('application/json')
					? (await response.json()).error
					: undefined,
			)
		}
		return response.json() as Promise<TResponse>
	}
}
