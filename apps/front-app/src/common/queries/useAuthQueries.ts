import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { generateFetchApi } from './queries'
import type { UserRole } from '../store/userSlice'

interface AuthLinkResponse {
	url: string
}

const fetchAuthLink = generateFetchApi<void, AuthLinkResponse>('/auth', {
	method: 'GET',
})

export const useFetchAuthLink = () => {
	return useQuery<AuthLinkResponse>({
		queryKey: ['fetchAuthLink'],
		queryFn: () => fetchAuthLink(),
	})
}

interface ExchangeTokenResponse {
	user: {
		id: string
		username: string
		role: UserRole
		profilePictureUrl: string
		locale: string
	}
}

const exchangeCodeForToken = generateFetchApi<
	{ code: string },
	ExchangeTokenResponse
>('/auth/callback', ({ code }) => ({
	method: 'POST',
	body: JSON.stringify({ code }),
}))

export const useExchangeToken = () => {
	return useMutation({
		mutationFn: (code: string) => exchangeCodeForToken({ code }),
	})
}

const fetchMe = generateFetchApi<void, ExchangeTokenResponse>('/auth/me', {
	method: 'GET',
})

export const useFetchMe = () => {
	return useQuery<ExchangeTokenResponse>({
		queryKey: ['fetchMe'],
		queryFn: () => fetchMe(),
		refetchOnWindowFocus: false,
		retry: false,
	})
}

export const useResetFetchMe = () => {
	const queryClient = useQueryClient()
	return () => {
		queryClient.resetQueries({ queryKey: ['fetchMe'] })
	}
}

const logout = generateFetchApi<void, void>('/auth/logout', {
	method: 'POST',
})

export const useLogout = () => {
	return useMutation({
		mutationFn: () => logout(),
	})
}
