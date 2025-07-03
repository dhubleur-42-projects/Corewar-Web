import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

declare module 'fastify' {
	interface FastifyRequest {
		prisma: PrismaClient
	}
}

export const prisma = new PrismaClient()

async function prismaPlugin(fastify: FastifyInstance) {
	await prisma.$connect()

	fastify.decorate('prisma', prisma)
	fastify.addHook('onRequest', async (request) => {
		request.prisma = prisma
	})

	fastify.addHook('onClose', async (app) => {
		await app.prisma.$disconnect()
	})
}

export default fp(prismaPlugin)
