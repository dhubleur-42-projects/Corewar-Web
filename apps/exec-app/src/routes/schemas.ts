import { ExecRequest } from '../plugins/exec'

export const execQueueSchema = {
	body: {
		type: 'object',
		properties: {
			token: { type: 'string' },
			requestId: { type: 'string' },
			request: {
				oneOf: [
					{
						type: 'object',
						properties: {
							type: { const: 'compiler' },
							code: { type: 'string' },
						},
						required: ['type', 'code'],
						additionalProperties: false,
					},
					{
						type: 'object',
						properties: {
							type: { const: 'match' },
							// TODO
						},
						required: ['type'],
						additionalProperties: false,
					},
				],
			},
			callbackUrl: { type: 'string', format: 'uri' },
		},
		required: ['token', 'requestId', 'request', 'callbackUrl'],
		additionalProperties: false,
	},
} as const

export interface ExecQueueBody {
	token: string
	requestId: string
	request: ExecRequest
	callbackUrl: string
}
