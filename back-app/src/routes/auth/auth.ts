import { FastifyPluginAsync } from 'fastify'
import { getSubLogger } from '../../utils/logger'
import config from '../../utils/config'
import { callbackSchema } from './schemas'

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
		schema: callbackSchema,
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
				logger.debug('No access token received', data)
				reply.code(500).send({ error: 'Failed to authenticate' })
				return
			}

			const userRes = await fetch('https://api.intra.42.fr/v2/me', {
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})
			if (!userRes.ok) {
				logger.debug('Failed to fetch user info', {
					status: userRes.status,
					statusText: userRes.statusText,
				})
				reply.code(500).send({ error: 'Failed to fetch user info' })
				return
			}

			const { id, login } = await userRes.json()

			if (id == null || login == null) {
				logger.debug('Invalid user info received', { id, login })
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
					expiresAt: new Date(
						Date.now() + config.rememberMeValidity * 1000,
					),
				},
			})

			reply.setCookie(
				config.accessTokenCookieName,
				fastify.jwt.sign(
					{
						userId: user.id,
						issuer: config.jwtIssuer,
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
				fastify.jwt.sign(
					{
						rememberMeId: rememberMe.id,
						issuer: config.jwtIssuer,
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
			const user = await request.transaction.user.findUnique({
				where: { id: request.userId },
			})

			if (user == null) {
				reply.status(404).send({ error: 'User not found' })
				return
			}

			reply.status(200).send({
				user: {
					id: request.userId,
					login: user.login,
				},
			})
		}),
	})

	fastify.post('/logout', {
		preHandler: fastify.authenticate,
		handler: fastify.withTransaction(async (request, reply) => {
			const { userId } = request

			await fastify.prisma.rememberMe.deleteMany({
				where: { userId },
			})

			reply.clearCookie(config.accessTokenCookieName)
			reply.clearCookie(config.rememberMeCookieName)
			reply.status(200).send({ message: 'Logout successful' })
		}),
	})
}

export default authRoutes
