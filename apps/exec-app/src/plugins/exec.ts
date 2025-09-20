import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'

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
			socketId: string,
		): Promise<ExecRequestResult>
		handleAsyncExecRequest(
			request: ExecRequest,
			requestId: string,
			callbackUrl: string,
		): Promise<ExecRequestResult>
	}
}

const execPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('handleSyncExecRequest', async (request, socketId) => {
		return ExecRequestResult.ERROR
	})
	fastify.decorate(
		'handleAsyncExecRequest',
		async (request, requestId, callbackUrl) => {
			return ExecRequestResult.ERROR
		},
	)
}

export default fp(execPlugin)
