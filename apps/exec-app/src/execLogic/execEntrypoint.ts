import { getSubLogger } from 'server-common'
import { ExecCallbackResultType, ExecQueueData } from '../async/execQueue'
import { FastifyInstance } from 'fastify'
import { execCallbackSocket, execCallbackWebhook } from './execCallback'

export async function processExecRequest(
	data: ExecQueueData,
	fastify: FastifyInstance,
) {
	const logger = getSubLogger('QUEUE')
	logger.info(`Processing job ${data.jobId}`)

	// Simulate some processing
	await new Promise((resolve) => setTimeout(resolve, 2000))
	const stdout = 'Execution output'
	const stderr = ''
	const exitCode = 0

	logger.info(`Job ${data.jobId} completed, sending callback`)

	switch (data.resultCallback.type) {
		case ExecCallbackResultType.SOCKET: {
			execCallbackSocket(
				data.resultCallback.socketId,
				stdout,
				stderr,
				exitCode,
				fastify,
				logger,
			)
			break
		}
		case ExecCallbackResultType.WEBHOOK: {
			execCallbackWebhook(
				data.resultCallback.callbackUrl,
				data.resultCallback.requestId,
				stdout,
				stderr,
				exitCode,
				logger,
			)
			break
		}
		default:
			logger.error(`Unknown callback type for job ${data.jobId}`)
	}
}
