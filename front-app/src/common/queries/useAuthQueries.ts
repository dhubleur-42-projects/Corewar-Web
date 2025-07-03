import { useMutation, useQuery } from '@tanstack/react-query'
import { fetchApi } from './queries'

interface AuthLinkResponse {
	url: string
}

const fetchAuthLink = async (): Promise<AuthLinkResponse> => {
	const response = await fetchApi('/auth', {
		method: 'GET',
	})
	if (!response.ok) {
		throw new Error('Failed to fetch auth link')
	}
	return response.json()
}

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

const exchangeCodeForToken = async (
	code: string,
): Promise<ExchangeTokenResponse> => {
	const response = await fetchApi('/auth/callback', {
		method: 'POST',
		body: JSON.stringify({ code }),
	})
	if (!response.ok) {
		throw new Error('Failed to exchange code for token')
	}
	return response.json()
}

export const useExchangeToken = () => {
	return useMutation({
		mutationFn: (code: string) => exchangeCodeForToken(code),
	})
}

const fetchMe = async (): Promise<ExchangeTokenResponse> => {
	const response = await fetchApi('/auth/me', {
		method: 'GET',
	})
	if (!response.ok) {
		throw new Error('Failed to fetch user data')
	}
	return response.json()
}

export const useFetchMe = () => {
	return useQuery<ExchangeTokenResponse>({
		queryKey: ['fetchMe'],
		queryFn: fetchMe,
		refetchOnWindowFocus: false,
		retry: false,
	})
}
