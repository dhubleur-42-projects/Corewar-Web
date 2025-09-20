import { FastifyInstance } from 'fastify'
import { Logger } from 'server-common/dist/utils/logger'

export function execCallbackSocket(
	socketId: string,
	stdout: string,
	stderr: string,
	exitCode: number,
	fastify: FastifyInstance,
	logger: Logger,
) {
	const socket = fastify.socketMap[socketId]
	if (socket == null) {
		logger.warn(`Socket ${socketId} not found for exec callback`)
		return
	}
	socket.emit('execResult', { stdout, stderr, exitCode })
}

export function execCallbackWebhook(
	callbackUrl: string,
	requestId: string,
	stdout: string,
	stderr: string,
	exitCode: number,
	logger: Logger,
) {
	fetch(callbackUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ requestId, stdout, stderr, exitCode }),
	})
		.then((res) => {
			if (!res.ok) {
				logger.error(
					`Failed to send exec callback to ${callbackUrl}: ${res.status} ${res.statusText}`,
				)
			}
		})
		.catch((err) => {
			logger.error(
				`Error sending exec callback to ${callbackUrl}: ${err}`,
			)
		})
}
