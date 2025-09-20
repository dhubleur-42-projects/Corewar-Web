import { FastifyPluginAsync } from 'fastify'
import { getLogger } from 'server-common'
import { ExecRequest } from '../plugins/exec'
import { AuthenticatedSocket } from '../plugins/socket'

interface ExecTokenPayload {
	userId: string
}

const socketRoute: FastifyPluginAsync = async (fastify) => {
	fastify.io.use(async (socket, next) => {
		const token = socket.handshake.auth.token
		if (token == null) {
			return next(new Error('Authentication error: No token provided'))
		}
		try {
			const payload =
				await fastify.verifyRsaToken<ExecTokenPayload>(token)
			if (!('userId' in payload)) {
				return next(
					new Error('Authentication error: Invalid token payload'),
				)
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			;(socket as any).userId = payload.userId
			return next()
		} catch (_) {
			return next(new Error('Authentication error: Invalid token'))
		}
	})

	fastify.io.on('connection', (socket) => {
		const authenticatedSocket = socket as AuthenticatedSocket
		getLogger().debug(
			`User ${authenticatedSocket.userId} connected with socket id: ${socket.id}`,
		)
		fastify.socketMap[socket.id] = authenticatedSocket

		socket.on('exec', async (request: ExecRequest, callback) => {
			getLogger().debug(
				`Received exec request from user ${authenticatedSocket.userId}: ${JSON.stringify(
					request,
				)}`,
			)
			const result = await fastify.handleSyncExecRequest(
				request,
				authenticatedSocket,
			)
			console.log('Exec result:', result)
			callback({
				result,
			})
		})

		socket.on('disconnect', () => {
			getLogger().debug(
				`User ${authenticatedSocket.userId} disconnected with socket id: ${socket.id}`,
			)
			delete fastify.socketMap[socket.id]
		})
	})
}

export default socketRoute
