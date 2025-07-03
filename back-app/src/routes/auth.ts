import { FastifyPluginAsync } from 'fastify'
import { getLogger, getSubLogger } from '../utils/logger'
import config from '../utils/config'
import { User } from '@prisma/client'

const authRoutes: FastifyPluginAsync = async (fastify) => {
	const logger = getSubLogger('AUTH')
	const redirectUri = `${config.frontUrl}/callback`
	const url = `https://api.intra.42.fr/oauth/authorize?client_id=${
		config.apiClientId
	}&redirect_uri=${encodeURIComponent(
		redirectUri,
	)}&response_type=code&scope=public`

	fastify.get('/', async (_, reply) => {
		reply.status(200).send({
			url,
		})
	})

	fastify.post('/callback', {
		schema: {
			body: {
				type: 'object',
				properties: {
					code: { type: 'string' },
				},
				required: ['code'],
			},
		},
		handler: fastify.withTransaction(async (request, reply) => {
			const { code } = request.body as { code: string }

			const res = await fetch('https://api.intra.42.fr/oauth/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: config.apiClientId,
					client_secret: config.apiClientSecret,
					grant_type: 'authorization_code',
					redirect_uri: redirectUri,
					code,
				}),
			})
			if (!res.ok) {
				logger.error('Failed to exchange code for token', {
					status: res.status,
					statusText: res.statusText,
				})
				reply.code(500).send({ error: 'Failed to authenticate' })
				return
			}

			const data = await res.json()
			const accessToken = data.access_token

			if (accessToken == null) {
				logger.error('No access token received', data)
				reply.code(500).send({ error: 'Failed to authenticate' })
				return
			}

			const userRes = await fetch('https://api.intra.42.fr/v2/me', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})
			if (!userRes.ok) {
				logger.error('Failed to fetch user info', {
					status: userRes.status,
					statusText: userRes.statusText,
				})
				reply.code(500).send({ error: 'Failed to fetch user info' })
				return
			}

			const { id, login } = await userRes.json()

			if (id == null || login == null) {
				logger.error('Invalid user info received', { id, login })
				reply.code(500).send({ error: 'Invalid user info received' })
				return
			}
			logger.debug(`User authenticated from 42: ${login} (${id})`)

			let user = await request.transaction.user.findUnique({
				where: { remoteId: id },
			})

			if (user == null) {
				logger.info(`Creating new user: ${login} (${id})`)
				user = await request.transaction.user.create({
					data: {
						remoteId: id,
						login,
					},
				})
			}

			const rememberMe = await request.transaction.rememberMe.create({
				data: {
					userId: user.id,
					expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
				},
			})

			reply.setCookie(
				'accessToken',
				fastify.jwt.sign(
					{ userId: user.id, issuer: config.jwtIssuer },
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
					{ rememberMeId: rememberMe.id, issuer: config.jwtIssuer },
					{ expiresIn: '30d' },
				),
				{
					httpOnly: true,
					sameSite: 'strict',
				},
			)
			reply.status(200).send({
				message: 'Authentication successful',
				user: {
					id: user.id,
					login: user.login,
				},
			})
		}),
	})

	fastify.get('/me', {
		preHandler: fastify.authenticate,
		handler: fastify.withTransaction(async (request, reply) => {
			reply.status(200).send({
				id: request.userId,
			})
		}),
	})
}

export default authRoutes
