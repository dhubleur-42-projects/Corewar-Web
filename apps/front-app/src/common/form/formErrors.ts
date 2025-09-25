import { defineI18n, useTranslate } from '../utils/i18n'

enum FormErrorType {
	Required = 'required',
	MinLength = 'minLength',
	MaxLength = 'maxLength',
	Pattern = 'pattern',
	AlreadyUsed = 'alreadyUsed',
	InvalidFile = 'invalidFile',
}

const formErrorI18n = defineI18n({
	en: {
		[FormErrorType.Required]: 'This field is required',
		[FormErrorType.MinLength]:
			'This field is too short (minimum is {min} characters)',
		[FormErrorType.MaxLength]:
			'This field is too long (maximum is {max} characters)',
		[FormErrorType.Pattern]: 'This field format is invalid',
		[FormErrorType.AlreadyUsed]: 'This value is already used',
		[FormErrorType.InvalidFile]: 'Invalid file type',
		unkown: 'Unknown error',
	},
	fr: {
		[FormErrorType.Required]: 'Ce champ est requis',
		[FormErrorType.MinLength]:
			'Ce champ est trop court (le minimum est de {min} caractères)',
		[FormErrorType.MaxLength]:
			'Ce champ est trop long (le maximum est de {max} caractères)',
		[FormErrorType.Pattern]: 'Le format de ce champ est invalide',
		[FormErrorType.AlreadyUsed]: 'Cette valeur est déjà utilisée',
		[FormErrorType.InvalidFile]: "Type de fichier invalide",
		unkown: 'Erreur inconnue',
	},
})

export function useFormatError() {
	const translate = useTranslate()

	return (errorType: string, params?: Record<string, any>) => {
		if (Object.values(FormErrorType).includes(errorType as FormErrorType)) {
			return translate(
				formErrorI18n[errorType as keyof typeof formErrorI18n],
				params,
			)
		}
		return translate(formErrorI18n.unkown, params)
	}
}
