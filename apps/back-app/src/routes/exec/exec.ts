import { FastifyPluginAsync } from 'fastify'
import config from '../../utils/config'

const execRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.secureGet('/token', {
		handler: async (request, reply) => {
			const token = await fastify.signRsaToken(
				{ userId: request.userId },
				config.execTokenValidity,
				config.execUrl,
			)
			return reply.send({ token })
		},
	})
}

export default execRoutes
