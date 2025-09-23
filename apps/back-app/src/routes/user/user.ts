import { FastifyPluginAsync } from 'fastify'
import { LocaleBody, LocaleSchema } from './schemas'

const userRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.securePost('/locale', {
		schema: LocaleSchema,
		handler: fastify.withTransaction(async (request, reply) => {
			const { locale } = request.body as LocaleBody
			const userId = request.userId!

			await request.transaction.user.update({
				where: { id: userId },
				data: { locale },
			})

			reply.status(200).send({ message: 'Locale updated' })
		}),
	})
}

export default userRoutes
