import Fastify from 'fastify'
import config from './utils/config'
import { createLogger, getLogger } from './utils/logger'
import prismaPlugin from './plugins/prisma'
import authRoutes from './routes/auth/auth'
import jwtPlugin from '@fastify/jwt'
import cookiePlugin from '@fastify/cookie'
import authPlugin from './plugins/auth'
import transactionPlugin from './plugins/transaction'
import corsPlugin from '@fastify/cors'
import { initQueues } from './async/queues/queues'
import { initJobs } from './async/jobs/jobs'
import { RedisOptions } from 'bullmq'
import { bullMqPlugin } from 'server-common'

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
	})
	getLogger().debug('Registered JWT plugin')

	await app.register(cookiePlugin)
	getLogger().debug('Registered Cookie plugin')

	await app.register(authPlugin)
	getLogger().debug('Registered Auth plugin')

	await app.register(bullMqPlugin, {
		redisOptions: connection,
	})
	getLogger().debug('Registered BullMQ plugin')

	initQueues(app)
	getLogger().debug('Initialized Queues')

	await initJobs(app)
	getLogger().debug('Initialized Jobs')

	await app.register(authRoutes, { prefix: '/auth' })
	getLogger().debug('Registered /auth routes')

	try {
		await app.listen({ port: 3000 })
		getLogger().info(`Server listening on port ${config.port}`)
	} catch (err) {
		getLogger().error(`Error starting server`, err)
		process.exit(1)
	}
})()
