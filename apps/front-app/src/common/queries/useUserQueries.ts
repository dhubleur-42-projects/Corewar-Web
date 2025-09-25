import { useMutation } from '@tanstack/react-query'
import { generateFetchApi } from './queries'
import type Language from '../utils/language'
import type { UserRole } from '../store/userSlice'

const updateLocale = generateFetchApi<{ locale: Language }, void>(
	'/user/locale',
	({ locale }) => ({
		method: 'POST',
		body: JSON.stringify({ locale: locale.toUpperCase() }),
	}),
)

export const useUpdateLocale = () => {
	return useMutation({
		mutationFn: (locale: Language) => updateLocale({ locale }),
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

const updateProfile = generateFetchApi<
	{ username: string; profilePicture: File | null },
	UpdateProfileResponse
>(
	'/user/profile',
	({ username, profilePicture }) => {
		const formData = new FormData()
		formData.append('username', username)
		if (profilePicture) {
			formData.append('profilePicture', profilePicture)
		}
		return {
			method: 'POST',
			body: formData,
		}
	},
	'multipart/form-data',
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
