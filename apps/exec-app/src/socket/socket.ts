import { FastifyPluginAsync } from 'fastify'
import { getLogger } from 'server-common'
import { Socket } from 'socket.io'

const socketMap: Record<string, Socket> = {}

interface AuthenticatedSocket extends Socket {
	userId: string
}

interface ExecTokenPayload {
	userId: string
}

const socketPlugin: FastifyPluginAsync = async (fastify) => {
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
		socketMap[socket.id] = socket

		socket.on('disconnect', () => {
			getLogger().debug(
				`User ${authenticatedSocket.userId} disconnected with socket id: ${socket.id}`,
			)
			delete socketMap[socket.id]
		})
	})
}

export default socketPlugin
