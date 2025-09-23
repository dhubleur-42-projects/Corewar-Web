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
