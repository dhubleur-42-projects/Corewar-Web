import fp from 'fastify-plugin'
import { Queue, Worker, JobsOptions } from 'bullmq'
import { FastifyPluginAsync } from 'fastify'
import { RedisOptions } from 'ioredis'
import config from '../utils/config'

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

const connection: RedisOptions = {
	host: config.redisHost,
	port: config.redisPort,
	password: config.redisPassword,
}

const bullMqPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('queues', new Map<string, Queue>())
	fastify.decorate('workers', new Map<string, Worker>())

	fastify.decorate(
		'createQueue',
		<T = unknown>(name: string, defaultOpts?: JobsOptions): Queue<T> => {
			const queue = new Queue<T>(name, {
				connection,
				defaultJobOptions: defaultOpts,
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
			const worker = new Worker<T>(name, processor, { connection })
			fastify.workers.set(name, worker)
			return worker
		},
	)
}

export default fp(bullMqPlugin)
