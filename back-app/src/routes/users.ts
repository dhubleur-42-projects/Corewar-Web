import { FastifyPluginAsync } from 'fastify'
import { getSubLogger } from '../utils/logger'

const userRoutes: FastifyPluginAsync = async (fastify) => {
	const logger = getSubLogger('USERS')

	fastify.get('/', async () => {
		logger.info('Fetching all users')
		return await fastify.prisma.user.findMany()
	})
}

export default userRoutes
