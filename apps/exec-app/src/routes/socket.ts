import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { getLogger } from 'server-common'
import { ExecRequest } from '../plugins/exec'
import { AuthenticatedSocket } from '../plugins/socket'
import { removeFromQueue } from '../async/execQueue'
import { Socket } from 'socket.io'

interface ExecTokenPayload {
	userId: string
	exp: number
}

const socketExpirationMap: Record<string, ReturnType<typeof setTimeout>> = {}

const expireSocket = (socket: Socket, fastify: FastifyInstance) => {
	if (fastify.socketMap[socket.id] == null) {
		return
	}
	getLogger().warn(`Expiring socket ${socket.id} due to inactivity`)
	socket.emit('error', 'Socket expired due to inactivity')
	socket.disconnect(true)
	delete socketExpirationMap[socket.id]
	delete fastify.socketMap[socket.id]
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
			socketExpirationMap[socket.id] = setTimeout(
				() => {
					expireSocket(socket, fastify)
				},
				payload.exp * 1000 - Date.now(),
			)
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

		socket.on('ping', (_, callback) => {
			callback('pong')
		})

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
			callback({
				result,
			})
		})

		socket.on(
			'renewToken',
			async (request: { token: string }, callback) => {
				try {
					const payload =
						await fastify.verifyRsaToken<ExecTokenPayload>(
							request.token,
						)
					if (!('userId' in payload)) {
						socket.emit('error', 'Token renewal error')
						return
					}
					if (payload.userId !== authenticatedSocket.userId) {
						socket.emit('error', 'Token renewal error')
						return
					}
					if (socketExpirationMap[socket.id]) {
						clearTimeout(socketExpirationMap[socket.id])
					}
					socketExpirationMap[socket.id] = setTimeout(
						() => {
							expireSocket(socket, fastify)
						},
						payload.exp * 1000 - Date.now(),
					)
					callback({ success: true })
				} catch (err) {
					getLogger().warn(
						`Error renewing token for user ${authenticatedSocket.userId}: ${err}`,
					)
					socket.emit('error', 'Token renewal error')
				}
			},
		)

		socket.on('disconnect', () => {
			getLogger().debug(
				`User ${authenticatedSocket.userId} disconnected with socket id: ${socket.id}`,
			)
			removeFromQueue(authenticatedSocket).catch((err) => {
				getLogger().warn(
					`Error removing job for user ${authenticatedSocket.userId} from queue: ${err}`,
				)
			})
			if (socketExpirationMap[socket.id]) {
				clearTimeout(socketExpirationMap[socket.id])
				delete socketExpirationMap[socket.id]
			}
			delete fastify.socketMap[socket.id]
		})
	})
}

export default socketRoute
