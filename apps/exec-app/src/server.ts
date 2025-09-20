import { RedisOptions } from 'ioredis'
import config from './utils/config'
import {
	bullMqPlugin,
	createLogger,
	getLogger,
	jwksPlugin,
	jwksRoutes,
} from 'server-common'
import Fastify from 'fastify'
import corsPlugin from '@fastify/cors'
import fastifySocketIO from 'fastify-socket.io'
import socketRoute from './routes/socket'
import execPlugin from './plugins/exec'
import execRoutes from './routes/exec'
import socketPlugin from './plugins/socket'

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
		origin: config.corsUrls,
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		credentials: true,
	})

	await app.register(bullMqPlugin, {
		redisOptions: connection,
		redisPrefix: config.redisPrefix,
	})
	getLogger().debug('Registered BullMQ plugin')

	await app.register(jwksPlugin, {
		redisOptions: connection,
		redisPrefix: config.redisPrefix,
		signOptions: {
			privateKeyValidityTime: config.privateKeyValidityTime,
			publicKeyValidityTime: config.privateKeyValidityTime * 2,
			issuer: config.jwtIssuer,
		},
		verifyOptions: {
			authorizedIssuers: config.authorizedIssuers,
			selfAudience: config.jwtIssuer,
		},
	})
	getLogger().debug('Registered JWKS plugin')

	await app.register(jwksRoutes)
	getLogger().debug('Registered JWKS routes')

	app.get('/health', async () => {
		return { status: 'ok' }
	})
	getLogger().debug('Registered /health route')

	await app.register(fastifySocketIO, {
		cors: {
			origin: config.corsUrls,
			methods: ['GET', 'POST'],
			credentials: true,
		},
	})
	getLogger().debug('Registered Socket.IO plugin')

	app.register(socketPlugin)
	getLogger().debug('Registered internal socket plugin')

	app.register(execPlugin)
	getLogger().debug('Registered exec plugin')

	await app.register(execRoutes, { prefix: '/exec' })
	getLogger().debug('Registered /exec routes')

	app.register(socketRoute)
	getLogger().debug('Registered socket routes')

	getLogger().debug('Routes tree:\n' + app.printRoutes())
	try {
		await app.listen({ port: config.port, host: '0.0.0.0' })
		getLogger().info(`Server listening on port ${config.port}`)
	} catch (err) {
		getLogger().error(`Error starting server`, err)
		process.exit(1)
	}
})()
