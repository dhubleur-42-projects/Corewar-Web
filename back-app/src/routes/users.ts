import { FastifyPluginAsync } from 'fastify'

const userRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get('/', async () => {
		return await fastify.prisma.user.findMany()
	})
}

export default userRoutes
