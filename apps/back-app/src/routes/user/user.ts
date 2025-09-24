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

	fastify.securePost('/profile', {
		handler: fastify.withTransaction(async (request, reply) => {
			const parts = request.parts()

			let username: string | null = null
			let profilePictureFile: Buffer | null = null

			for await (const part of parts) {
				if (
					part.type === 'file' &&
					part.fieldname === 'profilePicture'
				) {
					profilePictureFile = await part.toBuffer()
				} else if (
					part.type === 'field' &&
					part.fieldname === 'username'
				) {
					username = String(part.value)
				}
			}
			if (username == null) {
				return reply.status(400).send({ error: 'Username is required' })
			}
			if (username.length < 5 || username.length > 20) {
				return reply
					.status(400)
					.send({ error: 'Invalid username length' })
			}

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
