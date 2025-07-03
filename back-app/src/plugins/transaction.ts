import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
	interface FastifyInstance {
		withTransaction: (
			handler: (
				request: FastifyRequest & { transaction: any },
				reply: FastifyReply,
			) => Promise<any>,
		) => (request: FastifyRequest, reply: FastifyReply) => Promise<any>
	}

	interface FastifyRequest {
		transaction?: PrismaClient
	}
}

const transactionalPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('withTransaction', (handler) => {
		return async (request: any, reply: any) => {
			return fastify.prisma.$transaction(async (tx) => {
				request.transaction = tx
				return handler(request, reply)
			})
		}
	})
}

export default fp(transactionalPlugin)
