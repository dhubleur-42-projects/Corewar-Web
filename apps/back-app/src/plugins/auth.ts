import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import config from '../utils/config'
import { addToRemoveUsedRememberMeQueue } from '../async/queues/removeUsedRememberMeQueue'

declare module 'fastify' {
	interface FastifyRequest {
		userId?: string
	}

	interface FastifyInstance {
		authenticate(
			request: FastifyRequest,
			reply: FastifyReply,
		): Promise<void>
	}
}

const authPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorateRequest('userId', undefined)

	fastify.decorate('authenticate', async (request, reply) => {
		const accessToken = request.cookies['accessToken']
		const rememberMeToken = request.cookies['rememberMeToken']

		if (accessToken != null) {
			try {
				const payload = fastify.jwt.verify<{
					userId: string
				}>(accessToken, {
					allowedIss: config.selfUrl,
					allowedAud: config.selfUrl,
				})

				if (!payload.userId) {
					return reply.status(401).send({ error: 'Invalid token' })
				}

				const record = await fastify.prisma.user.findUnique({
					where: { id: payload.userId },
				})

				if (record == null) {
					return reply.status(401).send({ error: 'User not found' })
				}

				request.userId = payload.userId
				return
			} catch (_) {
				// Ignore invalid accessToken to fallback to rememberMeToken
			}
		}

		if (rememberMeToken != null) {
			try {
				const payload = fastify.jwt.verify<{
					rememberMeId: string
				}>(rememberMeToken, {
					allowedIss: config.selfUrl,
					allowedAud: config.selfUrl,
				})

				if (!payload.rememberMeId) {
					return reply.status(401).send({ error: 'Invalid token' })
				}

				const record = await fastify.prisma.rememberMe.findUnique({
					where: { id: payload.rememberMeId },
				})

				if (record == null) {
					return reply.status(401).send({ error: 'Invalid token' })
				}

				await addToRemoveUsedRememberMeQueue(record.id)

				const rememberMe = await fastify.prisma.rememberMe.create({
					data: {
						userId: record.userId,
						expiresAt: new Date(
							Date.now() + config.rememberMeValidity * 1000,
						),
					},
					include: {
						user: {
							select: {
								id: true,
								username: true,
							},
						},
					},
				})

				reply.setCookie(
					config.accessTokenCookieName,
					await reply.jwtSign(
						{
							userId: rememberMe.user.id,
						},
						{ expiresIn: `${config.accessTokenValidity}s` },
					),
					{
						...config.cookieConfig,
						expires: new Date(
							Date.now() + config.accessTokenValidity * 1000,
						),
					},
				)

				reply.setCookie(
					config.rememberMeCookieName,
					await reply.jwtSign(
						{
							rememberMeId: rememberMe.id,
						},
						{ expiresIn: `${config.rememberMeValidity}s` },
					),
					{
						...config.cookieConfig,
						expires: new Date(
							Date.now() + config.rememberMeValidity * 1000,
						),
					},
				)

				request.userId = record.userId
				return
			} catch (_) {
				return reply.status(401).send({ error: 'Invalid token' })
			}
		}

		return reply.status(401).send()
	})
}

export default fp(authPlugin)
