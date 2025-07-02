import Fastify from 'fastify'
import config from './utils/config'
import { createLogger, getLogger } from './utils/logger'
import prismaPlugin from './plugins/prisma'
import userRoutes from './routes/users'

createLogger(config.loggerKey, config.loggerLevel)

const app = Fastify()
app.register(prismaPlugin)
app.register(userRoutes, { prefix: '/users' })

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
