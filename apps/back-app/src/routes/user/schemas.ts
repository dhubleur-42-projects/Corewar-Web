export const LocaleSchema = {
	body: {
		type: 'object',
		properties: {
			locale: { type: 'string', enum: ['EN', 'FR'] },
		},
		required: ['locale'],
	},
}

export interface LocaleBody {
	locale: 'EN' | 'FR'
}

export const ProfileSchema = {
	body: {
		type: 'object',
		properties: {
			username: { type: 'string', minLength: 5, maxLength: 20 },
		},
		required: ['username'],
	},
}

export interface ProfileBody {
	username: string
}
