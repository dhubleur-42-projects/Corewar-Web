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

createLogger(config.loggerKey, config.loggerLevel)

const app = Fastify()

app.setErrorHandler((error, request, reply) => {
	getLogger().error(
		`Error in request ${request.method} ${request.url}`,
		error,
	)
	reply.status(500).send({ error: 'Internal Server Error' })
})

app.register(corsPlugin, {
	origin: config.frontUrl,
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true,
})

app.register(prismaPlugin)
getLogger().debug('Registered Prisma plugin')

app.register(transactionPlugin)
getLogger().debug('Registered Transaction plugin')

app.register(jwtPlugin, {
	secret: config.jwtSecret,
})
getLogger().debug('Registered JWT plugin')

app.register(cookiePlugin)
getLogger().debug('Registered Cookie plugin')

app.register(authPlugin)
getLogger().debug('Registered Auth plugin')

app.register(authRoutes, { prefix: '/auth' })
getLogger().debug('Registered /auth routes')

const start = async () => {
	try {
		await app.listen({ port: 3000 })
		getLogger().info(`Server listening on port ${config.port}`)
	} catch (err) {
		getLogger().error(`Error starting server`, err)
		process.exit(1)
	}
}

start()
