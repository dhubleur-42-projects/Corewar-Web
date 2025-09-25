import Fastify from 'fastify'
import config from './utils/config'
import { createLogger, getLogger, jwksPlugin, jwksRoutes } from 'server-common'
import prismaPlugin from './plugins/prisma'
import authRoutes from './routes/auth/auth'
import jwtPlugin from '@fastify/jwt'
import cookiePlugin from '@fastify/cookie'
import authPlugin from './plugins/auth'
import securityPlugin, { makeSecureMethod } from './plugins/security'
import transactionPlugin from './plugins/transaction'
import corsPlugin from '@fastify/cors'
import { initQueues } from './async/queues/queues'
import { initJobs } from './async/jobs/jobs'
import { RedisOptions } from 'bullmq'
import { bullMqPlugin } from 'server-common'
import execRoutes from './routes/exec/exec'
import userRoutes from './routes/user/user'
import fastifyMultipart from '@fastify/multipart'

const connection: RedisOptions = {
	host: config.redisHost,
	port: config.redisPort,
	password: config.redisPassword,
}

;(async () => {
	createLogger(config.loggerKey, config.loggerLevel)

	const app = Fastify()

	app.setErrorHandler((error, request, reply) => {
		if (error.validation) {
			reply.status(400).send({
				statusCode: 400,
				error: 'Bad Request',
				message: 'Invalid request payload',
				validation: error.validation,
			})
		} else {
			getLogger().error(
				`Error in request ${request.method} ${request.url}`,
				error,
			)
			reply.status(500).send({ error: 'Internal Server Error' })
		}
	})

	await app.register(corsPlugin, {
		origin: config.frontUrl,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		credentials: true,
	})

	await app.register(prismaPlugin)
	getLogger().debug('Registered Prisma plugin')

	await app.register(transactionPlugin)
	getLogger().debug('Registered Transaction plugin')

	await app.register(jwtPlugin, {
		secret: config.jwtSecret,
		sign: {
			algorithm: 'HS256',
			iss: config.selfUrl,
			aud: config.selfUrl,
		},
	})
	getLogger().debug('Registered JWT plugin')

	await app.register(cookiePlugin)
	getLogger().debug('Registered Cookie plugin')

	await app.register(authPlugin)
	getLogger().debug('Registered Auth plugin')

	await app.register(securityPlugin)
	app.addHook('onRegister', (childInstance) => {
		childInstance.decorate(
			'secureGet',
			makeSecureMethod(childInstance, 'get'),
		)
		childInstance.decorate(
			'securePost',
			makeSecureMethod(childInstance, 'post'),
		)
		childInstance.decorate(
			'securePut',
			makeSecureMethod(childInstance, 'put'),
		)
		childInstance.decorate(
			'secureDelete',
			makeSecureMethod(childInstance, 'delete'),
		)
	})
	getLogger().debug('Registered Security plugin')

	await app.register(bullMqPlugin, {
		redisOptions: connection,
		redisPrefix: config.redisPrefix,
	})
	getLogger().debug('Registered BullMQ plugin')

	initQueues(app)
	getLogger().debug('Initialized Queues')

	await initJobs(app)
	getLogger().debug('Initialized Jobs')

	await app.register(jwksPlugin, {
		redisOptions: connection,
		redisPrefix: config.redisPrefix,
		signOptions: {
			privateKeyValidityTime: config.privateKeyValidityTime,
			publicKeyValidityTime: config.privateKeyValidityTime * 2,
			issuer: config.selfUrl,
		},
		verifyOptions: {
			authorizedIssuers: config.authorizedIssuers,
			selfAudience: config.selfUrl,
		},
	})
	getLogger().debug('Registered JWKS plugin')

	await app.register(jwksRoutes)
	getLogger().debug('Registered JWKS routes')

	await app.register(fastifyMultipart, {
		limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
	})
	getLogger().debug('Registered Multipart plugin')

	await app.register(authRoutes, { prefix: '/auth' })
	getLogger().debug('Registered /auth routes')

	await app.register(execRoutes, { prefix: '/exec' })
	getLogger().debug('Registered /exec routes')

	await app.register(userRoutes, { prefix: '/user' })
	getLogger().debug('Registered /user routes')

	app.get('/health', async () => {
		return { status: 'ok' }
	})
	getLogger().debug('Registered /health route')

	getLogger().debug('Routes tree:\n' + app.printRoutes())

	try {
		await app.listen({ port: config.port, host: '0.0.0.0' })
		getLogger().info(`Server listening on port ${config.port}`)
	} catch (err) {
		getLogger().error(`Error starting server`, err)
		process.exit(1)
	}
})()
