import fp from 'fastify-plugin'
import { Queue, Worker, JobsOptions } from 'bullmq'
import { FastifyPluginAsync } from 'fastify'
import { RedisOptions } from 'ioredis'

declare module 'fastify' {
	interface FastifyInstance {
		queues: Map<string, Queue>
		workers: Map<string, Worker>
		createQueue<T = unknown>(
			name: string,
			defaultOpts?: JobsOptions,
		): Queue<T>
		createWorker<T = unknown>(
			name: string,
			processor: (job: unknown) => Promise<unknown>,
		): Worker<T>
	}
}

const bullMqPlugin: FastifyPluginAsync<{ redisOptions: RedisOptions, redisPrefix: string }> = async (
	fastify,
	options
) => {
	const { redisOptions, redisPrefix } = options
	fastify.decorate('queues', new Map<string, Queue>())
	fastify.decorate('workers', new Map<string, Worker>())

	fastify.decorate(
		'createQueue',
		<T = unknown>(name: string, defaultOpts?: JobsOptions): Queue<T> => {
			const queue = new Queue<T>(name, {
				connection: redisOptions,
				defaultJobOptions: defaultOpts,
				prefix: redisPrefix,
			})
			fastify.queues.set(name, queue)
			return queue
		},
	)

	fastify.decorate(
		'createWorker',
		<T = unknown>(
			name: string,
			processor: (job: unknown) => Promise<unknown>,
		): Worker<T> => {
			const worker = new Worker<T>(name, processor, {
				connection: redisOptions,
				prefix: redisPrefix,
			})
			fastify.workers.set(name, worker)
			return worker
		},
	)
}

export default fp(bullMqPlugin)
