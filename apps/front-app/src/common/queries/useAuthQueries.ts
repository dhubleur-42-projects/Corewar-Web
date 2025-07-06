import { useMutation, useQuery } from '@tanstack/react-query'
import { generateFetchApi } from './queries'

interface AuthLinkResponse {
	url: string
}

const fetchAuthLink = generateFetchApi<[], AuthLinkResponse>('/auth', {
	method: 'GET',
})

export const useFetchAuthLink = () => {
	return useQuery<AuthLinkResponse>({
		queryKey: ['fetchAuthLink'],
		queryFn: fetchAuthLink,
	})
}

interface ExchangeTokenResponse {
	user: {
		id: string
		login: string
	}
}

const exchangeCodeForToken = generateFetchApi<[string], ExchangeTokenResponse>(
	'/auth/callback',
	(code) => ({
		method: 'POST',
		body: JSON.stringify({ code }),
	}),
)

export const useExchangeToken = () => {
	return useMutation({
		mutationFn: (code: string) => exchangeCodeForToken(code),
	})
}

const fetchMe = generateFetchApi<[], ExchangeTokenResponse>('/auth/me', {
	method: 'GET',
})

export const useFetchMe = () => {
	return useQuery<ExchangeTokenResponse>({
		queryKey: ['fetchMe'],
		queryFn: fetchMe,
		refetchOnWindowFocus: false,
		retry: false,
	})
}

const logout = generateFetchApi<[], void>('/auth/logout', {
	method: 'POST',
})

export const useLogout = () => {
	return useMutation({
		mutationFn: logout,
		onSuccess: () => {
			window.location.href = '/'
		},
	})
}
