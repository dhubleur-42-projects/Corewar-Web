import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { Socket } from 'socket.io'

export interface AuthenticatedSocket extends Socket {
	userId: string
}

declare module 'fastify' {
	interface FastifyInstance {
		socketMap: Record<string, AuthenticatedSocket>
	}
}

const socketPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('socketMap', {})
}

export default fp(socketPlugin)
