import { Button, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../../common/utils/i18n'
import useStore from '../../../common/store/store'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { useFormatError } from '../../../common/form/formErrors'
import { useUpdateProfile } from '../../../common/queries/useUserQueries'
import { HttpError } from '../../../common/queries/queries'
import { useEffect, useState } from 'react'

const i18n = defineI18n({
	en: {
		profile: 'Profile',
		username: 'Username',
		submit: 'Save',
		profileUpdated: 'Profile updated successfully',
	},
	fr: {
		profile: 'Profil',
		username: "Nom d'utilisateur",
		submit: 'Enregistrer',
		profileUpdated: 'Profil mis à jour avec succès',
	},
})

const ProfileContainer = styled('form')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	gap: 16,
})

const ProfileTitle = styled('h1')({
	fontSize: 24,
	fontWeight: 'bold',
})

const FormElement = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	gap: 8,
	width: 300,
})

const Formlabel = styled('label')({
	fontSize: 14,
})

const FormInput = styled('input')({
	padding: 8,
	fontSize: 14,
	borderRadius: 4,
	width: '100%',
})

const FormError = styled('span')({
	color: 'red',
	fontSize: 12,
})

const FormSuccess = styled('span')({
	color: 'green',
	fontSize: 12,
})

type UserFormData = {
	username: string
}

function UserProfile() {
	const translate = useTranslate()
	const formatError = useFormatError()

	const { user, setUser } = useStore()

	const [isSuccess, setIsSuccess] = useState(false)

	const methods = useForm<UserFormData>({
		defaultValues: {
			username: user!.username,
		},
	})

	const watchedValues = useWatch({
		control: methods.control,
	})

	useEffect(() => {
		setIsSuccess(false)
	}, [watchedValues.username])

	const { mutate: updateUserProfile } = useUpdateProfile({
		onError: (error) => {
			if (
				error instanceof HttpError &&
				error.getError() === 'USERNAME_ALREADY_USED'
			) {
				error.setTreated()
				methods.setError('username', { type: 'alreadyUsed' })
			}
		},
		onSuccess: (data) => {
			setUser(data.user)
			setIsSuccess(true)
		},
	})

	const onSubmit: SubmitHandler<UserFormData> = (data) => {
		if (data.username === user!.username) {
			methods.setError('username', { type: 'alreadyUsed' })
			return
		}
		updateUserProfile(data.username)
	}

	return (
		<ProfileContainer onSubmit={methods.handleSubmit(onSubmit)}>
			<ProfileTitle>{translate(i18n.profile)}</ProfileTitle>
			<FormElement>
				<Formlabel>{translate(i18n.username)}</Formlabel>
				<FormInput
					id="username"
					type="text"
					placeholder={translate(i18n.username)}
					{...methods.register('username', {
						required: true,
						minLength: 5,
						maxLength: 20,
					})}
				/>
				{methods.formState.errors.username != null && (
					<FormError>
						{formatError(methods.formState.errors.username.type, {
							min: 5,
							max: 20,
						})}
					</FormError>
				)}
			</FormElement>
			<Button type="submit" variant="contained" color="primary">
				{translate(i18n.submit)}
			</Button>
			{isSuccess && (
				<FormSuccess>{translate(i18n.profileUpdated)}</FormSuccess>
			)}
		</ProfileContainer>
	)
}

export default UserProfile
