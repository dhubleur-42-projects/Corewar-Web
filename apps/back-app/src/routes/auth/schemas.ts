export const callbackSchema = {
	body: {
		type: 'object',
		properties: {
			code: { type: 'string' },
		},
		required: ['code'],
	},
}
