import { FastifyPluginAsync } from 'fastify'
import { LocaleBody, LocaleSchema, ProfileBody, ProfileSchema } from './schemas'

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

	fastify.securePost('/profile', {
		schema: ProfileSchema,
		handler: fastify.withTransaction(async (request, reply) => {
			const { username } = request.body as ProfileBody
			const userId = request.userId!

			const isUsedUsername =
				(await request.transaction.user.findUnique({
					where: { username },
				})) != null

			if (isUsedUsername) {
				return reply
					.status(400)
					.send({ error: 'USERNAME_ALREADY_USED' })
			}

			const newUser = await request.transaction.user.update({
				where: { id: userId },
				data: { username },
			})

			reply.status(200).send({
				user: {
					id: newUser.id,
					username: newUser.username,
					role: newUser.role,
					profilePictureUrl: newUser.profilePictureUrl,
				},
			})
		}),
	})
}

export default userRoutes
