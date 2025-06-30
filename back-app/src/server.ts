import fastify from 'fastify'
import config from './utils/config'
import { createLogger, getLogger } from './utils/logger'

const server = fastify()
createLogger(config.loggerKey, config.loggerLevel)

server.get('/', async () => {
	return 'Hello world\n'
})

server.listen({ port: config.port }, (err, address) => {
	if (err) {
		console.error(err)
		process.exit(1)
	}
	getLogger().info(`Server listening at ${address}`)
})
