import { FastifyInstance } from 'fastify'
import { initRemoveUsedRememberMeQueue } from './removeUsedRememberMeQueue'

export function initQueues(fastify: FastifyInstance) {
	initRemoveUsedRememberMeQueue(fastify)
}
