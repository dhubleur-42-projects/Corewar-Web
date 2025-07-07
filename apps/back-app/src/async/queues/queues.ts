import { FastifyInstance } from 'fastify'
import initUsedRememberMeQueue from './removeUsedRememberMeQueue'
import { JobsOptions } from 'bullmq'
import { createQueue } from 'server-common'
import { TransactionClient } from '../../plugins/transaction'

export enum QueueName {
	REMOVE_USED_REMEMBER_ME = 'removeUsedRememberMe',
}

type TransactionalQueueHandler<T> = (
	data: T,
	transaction: TransactionClient,
) => Promise<void>

export function createTransactionalQueue<T>(
	fastify: FastifyInstance,
	name: QueueName,
	queueOption: JobsOptions,
	handler: TransactionalQueueHandler<T>,
) {
	createQueue<T>(fastify, name, queueOption, async (data: T) => {
		await fastify.prisma.$transaction(async (transaction) => {
			await handler(data, transaction)
		})
	})
}

export function initQueues(fastify: FastifyInstance) {
	initUsedRememberMeQueue(fastify)
}
