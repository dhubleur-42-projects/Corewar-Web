import { RedisOptions } from "ioredis";
import config from "./utils/config";
import { bullMqPlugin, createLogger, getLogger, jwksPlugin, jwksRoutes } from "server-common";
import Fastify from 'fastify'
import corsPlugin from '@fastify/cors'
import fastifySocketIO from "fastify-socket.io";
import socketPlugin from "./socket/socket";

const connection: RedisOptions = {
	host: config.redisHost,
	port: config.redisPort,
	password: config.redisPassword,
}

;(async () => {
	createLogger(config.loggerKey, config.loggerLevel)

	const app = Fastify()

	app.setErrorHandler((error, request, reply) => {
		getLogger().error(
			`Error in request ${request.method} ${request.url}`,
			error,
		)
		reply.status(500).send({ error: 'Internal Server Error' })
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
		}
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
		}
	});
	getLogger().debug('Registered Socket.IO plugin')

	app.register(socketPlugin);
	getLogger().debug('Registered socket plugin')

	getLogger().debug("Routes tree:\n" + app.printRoutes())
	try {
		await app.listen({ port: config.port, host: '0.0.0.0' })
		getLogger().info(`Server listening on port ${config.port}`)
	} catch (err) {
		getLogger().error(`Error starting server`, err)
		process.exit(1)
	}
})()

