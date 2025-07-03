import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import config from '../utils/config'

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
				const payload = await fastify.jwt.verify<{
					userId: string
					issuer: string
				}>(accessToken)

				if (!payload.userId) {
					return reply
						.status(401)
						.send({ error: 'Invalid accessToken payload' })
				}

				if (!payload.issuer || payload.issuer !== config.jwtIssuer) {
					return reply
						.status(401)
						.send({ error: 'Invalid accessToken issuer' })
				}

				const record = await fastify.prisma.user.findUnique({
					where: { id: payload.userId },
				})

				if (record == null) {
					return reply.status(401).send({ error: 'User not found' })
				}

				request.userId = payload.userId
				return
			} catch (_) {}
		}

		if (rememberMeToken != null) {
			try {
				const payload = await fastify.jwt.verify<{
					rememberMeId: string
					issuer: string
				}>(rememberMeToken)

				if (!payload.rememberMeId) {
					return reply
						.status(401)
						.send({ error: 'Invalid rememberMeToken payload' })
				}

				if (!payload.issuer || payload.issuer !== config.jwtIssuer) {
					return reply
						.status(401)
						.send({ error: 'Invalid rememberMeToken issuer' })
				}

				const record = await fastify.prisma.rememberMe.findUnique({
					where: { id: payload.rememberMeId },
				})

				if (record == null) {
					return reply
						.status(401)
						.send({ error: 'RememberMe ID not found' })
				}

				setTimeout(() => {
					fastify.prisma.rememberMe.delete({
						where: { id: record.id },
					})
				}, 10_000)

				const rememberMe = await fastify.prisma.rememberMe.create({
					data: {
						userId: record.userId,
						expiresAt: new Date(
							Date.now() + 30 * 24 * 60 * 60 * 1000,
						), // 30 days
					},
				})

				reply.setCookie(
					'accessToken',
					fastify.jwt.sign(
						{ userId: record.userId, issuer: config.jwtIssuer },
						{ expiresIn: '1h' },
					),
					{
						httpOnly: true,
						sameSite: 'strict',
					},
				)

				reply.setCookie(
					'rememberMeToken',
					fastify.jwt.sign(
						{
							rememberMeId: rememberMe.id,
							issuer: config.jwtIssuer,
						},
						{ expiresIn: '30d' },
					),
					{
						httpOnly: true,
						sameSite: 'strict',
					},
				)

				request.userId = record.userId
				return
			} catch (err) {
				return reply
					.status(401)
					.send({ error: 'Invalid rememberMeToken' })
			}
		}

		return reply.status(401).send({ error: 'Authentication required' })
	})
}

export default fp(authPlugin)
