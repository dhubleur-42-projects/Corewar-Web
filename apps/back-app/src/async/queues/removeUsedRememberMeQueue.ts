import { FastifyInstance } from 'fastify'
import { getQueueAdder, getSubLogger } from 'server-common'
import { TransactionClient } from '../../plugins/transaction'
import { createTransactionalQueue, QueueName } from './queues'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

export interface RemoveUsedRememberMeQueueData {
	rememberMeId: string
}

const initUsedRememberMeQueue = (fastify: FastifyInstance) => {
	createTransactionalQueue(
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
	const logger = getSubLogger('QUEUE')
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

export async function addToRemoveUsedRememberMeQueue(rememberMeId: string) {
	await getQueueAdder<RemoveUsedRememberMeQueueData>(
		QueueName.REMOVE_USED_REMEMBER_ME,
	)({ rememberMeId }, { delay: 1000 })
}

export default initUsedRememberMeQueue
