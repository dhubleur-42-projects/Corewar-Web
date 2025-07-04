import { Queue } from 'bullmq'
import { FastifyInstance } from 'fastify'
import { getSubLogger } from '../../utils/logger'

interface RemoveUsedRememberMeQueueData {
	rememberMeId: string
}

let removeUsedRememberMe: Queue<RemoveUsedRememberMeQueueData>

const key = 'removeUsedRememberMe'

export function initRemoveUsedRememberMeQueue(fastify: FastifyInstance) {
	removeUsedRememberMe = fastify.createQueue<RemoveUsedRememberMeQueueData>(
		key,
		{
			attempts: 5,
			backoff: {
				type: 'fixed',
				delay: 10_000,
			},
		},
	)
	fastify.createWorker(key, createRemoveUsedRememberMeWorker(fastify))
}

export function addToRemoveUsedRememberMeQueue(rememberMeId: string) {
	if (removeUsedRememberMe == null) {
		throw new Error('removeUsedRememberMe is not initialized')
	}

	return removeUsedRememberMe.add(
		'expire',
		{
			rememberMeId,
		},
		{
			delay: 1000,
		},
	)
}

function createRemoveUsedRememberMeWorker(fastify: FastifyInstance) {
	const logger = getSubLogger('REMOVE USED REMEMBER ME WORKER')
	return async (job: unknown) => {
		const typedJob = job as { data: RemoveUsedRememberMeQueueData }
		try {
			// eslint-disable-next-line no-restricted-properties
			await fastify.prisma.$transaction(async (prisma) => {
				await prisma.rememberMe.delete({
					where: { id: typedJob.data.rememberMeId },
				})
				logger.debug(
					`Removed rememberMeId: ${typedJob.data.rememberMeId}`,
				)
			})
		} catch (error) {
			logger.error(
				`Error removing rememberMeId: ${typedJob.data.rememberMeId}`,
				error,
			)
		}
	}
}
