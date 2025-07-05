import { FastifyInstance } from 'fastify'
import initUsedRememberMeQueue from './removeUsedRememberMeQueue'
import { Job, JobsOptions, Queue } from 'bullmq'
import { getSubLogger } from '../../utils/logger'
import { TransactionClient } from '../../plugins/transaction'

export enum QueueName {
	REMOVE_USED_REMEMBER_ME = 'removeUsedRememberMe',
}

type QueueHandler<T> = (
	data: T,
	transaction: TransactionClient,
) => Promise<void>
type QueueAdder<T> = (
	data: T,
	opts?: JobsOptions,
) => Promise<Job<unknown, unknown, string>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queues: Record<string, Queue<any>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adders: Record<string, QueueAdder<any>> = {}

export function createQueue<T>(
	fastify: FastifyInstance,
	name: QueueName,
	queueOption: JobsOptions,
	handler: QueueHandler<T>,
) {
	const logger = getSubLogger('QUEUES')
	const queue = fastify.createQueue<T>(name, queueOption)
	queues[name] = queue

	fastify.createWorker(name, async (job) => {
		const typedJob = job as { data: T }
		// eslint-disable-next-line no-restricted-properties
		fastify.prisma.$transaction(async (transaction) => {
			try {
				await handler(typedJob.data, transaction)
			} catch (error) {
				logger.error(`Error processing job from queue ${name}:`, error)
			}
		})
	})

	const adder: QueueAdder<T> = async (data: T, opts?: JobsOptions) => {
		if (!queues[name]) {
			throw new Error(`Queue ${name} is not initialized`)
		}
		return await queues[name].add(name, data, opts)
	}
	adders[name] = adder
}

export function getQueueAdder<T>(name: QueueName): QueueAdder<T> {
	if (!adders[name]) {
		throw new Error(`Adder for queue ${name} is not initialized`)
	}
	return adders[name] as QueueAdder<T>
}

export function initQueues(fastify: FastifyInstance) {
	initUsedRememberMeQueue(fastify)
}
