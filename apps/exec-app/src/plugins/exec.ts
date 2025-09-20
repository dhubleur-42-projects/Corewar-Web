import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import {
	addToExecQueue,
	ExecCallbackResultType,
	ExecPriority,
} from '../async/execQueue'
import { AuthenticatedSocket } from './socket'

export enum ExecType {
	COMPILER = 'compiler',
	MATCH = 'match',
}

export type ExecRequest =
	| {
			type: ExecType.COMPILER
			code: string
	  }
	| {
			type: ExecType.MATCH
			// TODO
	  }

export enum ExecRequestResult {
	QUEUED = 'queued',
	ALREADY_RUNNING = 'already_running',
	ERROR = 'error',
}

declare module 'fastify' {
	interface FastifyInstance {
		handleSyncExecRequest(
			request: ExecRequest,
			socket: AuthenticatedSocket,
		): Promise<ExecRequestResult>
		handleAsyncExecRequest(
			request: ExecRequest,
			requestId: string,
			callbackUrl: string,
		): Promise<ExecRequestResult>
	}
}

const execPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('handleSyncExecRequest', async (request, socket) => {
		return await addToExecQueue(
			`user-${socket.userId}`,
			request,
			{ type: ExecCallbackResultType.SOCKET, socketId: socket.id },
			ExecPriority.HIGH,
		)
	})
	fastify.decorate(
		'handleAsyncExecRequest',
		async (request, requestId, callbackUrl) => {
			return await addToExecQueue(
				`id-${requestId}`,
				request,
				{
					type: ExecCallbackResultType.WEBHOOK,
					callbackUrl,
					requestId,
				},
				ExecPriority.LOW,
			)
		},
	)
}

export default fp(execPlugin)
