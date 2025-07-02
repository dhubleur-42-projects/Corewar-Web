import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'
import { FastifyInstance } from 'fastify'

export const prisma = new PrismaClient()

async function prismaPlugin(fastify: FastifyInstance) {
	await prisma.$connect()

	fastify.decorate('prisma', prisma)

	fastify.addHook('onClose', async (app) => {
		await app.prisma.$disconnect()
	})
}

export default fp(prismaPlugin)
