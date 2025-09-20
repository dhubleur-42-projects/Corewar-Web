import { FastifyPluginAsync } from 'fastify'
import { ExecQueueBody, execQueueSchema } from './schemas'
import { getLogger } from 'server-common'

interface ExecTokenPayload {
	role: string
}

const execRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.post('/queue', {
		schema: execQueueSchema,
		preHandler: async (request, reply, done) => {
			const token = (request.body as ExecQueueBody).token
			try {
				const payload =
					await fastify.verifyRsaToken<ExecTokenPayload>(token)
				if (payload.role !== 'exec') {
					reply.status(403).send({ error: 'Forbidden' })
					return
				}
				done()
			} catch (_) {
				reply.status(401).send({ error: 'Unauthorized' })
			}
		},
		handler: async (request, reply) => {
			const body = request.body as ExecQueueBody
			getLogger().debug(
				`Received async exec request: ${JSON.stringify(body.request)}`,
			)
			const result = await fastify.handleAsyncExecRequest(
				body.request,
				body.requestId,
				body.callbackUrl,
			)
			reply.send({ result })
		},
	})
}

export default execRoutes
