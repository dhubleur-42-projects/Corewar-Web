import { useMutation } from '@tanstack/react-query'
import { generateFetchApi } from './queries'
import type Language from '../utils/language'
import type { UserRole } from '../store/userSlice'

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

interface UpdateProfileResponse {
	user: {
		id: string
		username: string
		role: UserRole
		profilePictureUrl: string
	}
}

const updateProfile = generateFetchApi<[string], UpdateProfileResponse>(
	'/user/profile',
	(username) => ({
		method: 'POST',
		body: JSON.stringify({ username }),
	}),
)

export const useUpdateProfile = ({
	onError,
	onSuccess,
}: {
	onError: (error: unknown) => void
	onSuccess: (data: UpdateProfileResponse) => void
}) => {
	return useMutation({
		mutationFn: updateProfile,
		onError,
		onSuccess,
	})
}
