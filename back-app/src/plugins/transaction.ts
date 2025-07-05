import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import { PrismaClient } from '@prisma/client'

export type TransactionClient = Omit<
	PrismaClient,
	'$connect' | '$disconnect' | '$on' | '$use' | '$extends' | '$transaction'
>

type TransactionRequest = FastifyRequest & {
	transaction: TransactionClient
}

declare module 'fastify' {
	interface FastifyInstance {
		withTransaction: (
			handler: (
				request: TransactionRequest,
				reply: FastifyReply,
			) => Promise<unknown>,
		) => (
			request: FastifyRequest & { prisma: PrismaClient },
			reply: FastifyReply,
		) => Promise<unknown>
	}

	interface FastifyRequest {
		transaction?: TransactionClient
	}
}

const transactionalPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('withTransaction', (handler) => {
		return async (
			request: FastifyRequest & { prisma: PrismaClient },
			reply: FastifyReply,
		) => {
			// eslint-disable-next-line no-restricted-properties
			return fastify.prisma.$transaction(async (tx) => {
				request.transaction = tx
				return handler(request as TransactionRequest, reply)
			})
		}
	})
}

export default fp(transactionalPlugin)
