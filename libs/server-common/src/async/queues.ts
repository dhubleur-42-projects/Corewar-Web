import { FastifyInstance } from 'fastify'
import { Job, JobsOptions, Queue, WorkerOptions } from 'bullmq'
import { getSubLogger } from '../utils/logger'

export type QueueHandler<T> = (data: T) => Promise<void>
export type QueueAdder<T> = (
	data: T,
	opts?: JobsOptions,
) => Promise<Job<unknown, unknown, string>>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queues: Record<string, Queue<any>> = {}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adders: Record<string, QueueAdder<any>> = {}

export function createQueue<T>(
	fastify: FastifyInstance,
	name: string,
	queueOption: JobsOptions,
	handler: QueueHandler<T>,
	workerOptions?: Partial<WorkerOptions>,
) {
	const logger = getSubLogger('QUEUE')
	const queue = fastify.createQueue<T>(name, queueOption)
	queues[name] = queue

	fastify.createWorker(
		name,
		async (job) => {
			const typedJob = job as { data: T }
			try {
				await handler(typedJob.data)
			} catch (error) {
				logger.error(`Error processing job from queue ${name}:`, error)
			}
		},
		workerOptions,
	)

	const adder: QueueAdder<T> = async (data: T, opts?: JobsOptions) => {
		if (!queues[name]) {
			throw new Error(`Queue ${name} is not initialized`)
		}
		return await queues[name].add(name, data, opts)
	}
	adders[name] = adder
}

export function getQueueAdder<T>(name: string): QueueAdder<T> {
	if (!adders[name]) {
		throw new Error(`Adder for queue ${name} is not initialized`)
	}
	return adders[name] as QueueAdder<T>
}

export function getQueue(name: string): Queue {
	if (!queues[name]) {
		throw new Error(`Queue ${name} is not initialized`)
	}
	return queues[name]
}
