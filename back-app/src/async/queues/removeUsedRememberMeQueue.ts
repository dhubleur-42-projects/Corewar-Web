import { FastifyInstance } from 'fastify'
import { getSubLogger } from '../../utils/logger'
import { TransactionClient } from '../../plugins/transaction'
import { createQueue, QueueName } from './queues'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export interface RemoveUsedRememberMeQueueData {
	rememberMeId: string
}

const initUsedRememberMeQueue = (fastify: FastifyInstance) => {
	createQueue(
		fastify,
		QueueName.REMOVE_USED_REMEMBER_ME,
		{
			attempts: 5,
			backoff: {
				type: 'fixed',
				delay: 10_000,
			},
		},
		removeUsedRememeberMeHandler,
	)
}

const removeUsedRememeberMeHandler = async (
	data: RemoveUsedRememberMeQueueData,
	transaction: TransactionClient,
) => {
	const logger = getSubLogger('REMOVE USED REMEMBER ME QUEUE')
	try {
		await transaction.rememberMe.delete({
			where: { id: data.rememberMeId },
		})
		logger.debug(`Removed rememberMeId: ${data.rememberMeId}`)
	} catch (error) {
		if (error instanceof PrismaClientKnownRequestError) {
			if (error.code === 'P2025') {
				logger.warn(
					`RememberMe with id ${data.rememberMeId} not found, skipping removal`,
				)
				return
			}
		}
		throw error
	}
}

export default initUsedRememberMeQueue
