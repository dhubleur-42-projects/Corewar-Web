import { FastifyInstance } from 'fastify'
import { ExecRequest, ExecRequestResult } from '../plugins/exec'
import { createQueue, getLogger } from 'server-common'
import { getQueue, getQueueAdder } from 'server-common/dist/async/queues'
import config from '../utils/config'
import { processExecRequest } from '../execLogic/execEntrypoint'

export enum ExecPriority {
	HIGH = 1,
	LOW = 10,
}

export enum ExecCallbackResultType {
	SOCKET,
	WEBHOOK,
}

export type ExecResultCallback =
	| {
			type: ExecCallbackResultType.SOCKET
			socketId: string
	  }
	| {
			type: ExecCallbackResultType.WEBHOOK
			callbackUrl: string
			requestId: string
	  }

export interface ExecQueueData {
	jobId: string
	resultCallback: ExecResultCallback
	request: ExecRequest
}

export function initExecQueue(fastify: FastifyInstance) {
	createQueue<ExecQueueData>(
		fastify,
		'exec',
		{
			attempts: 1,
		},
		async (data: ExecQueueData) => {
			await processExecRequest(data, fastify)
		},
		{ concurrency: config.concurrencyLimit },
	)
}

export async function addToExecQueue(
	jobId: string,
	request: ExecRequest,
	callback: ExecResultCallback,
	priority: ExecPriority,
): Promise<ExecRequestResult> {
	const queue = getQueue('exec')
	if (queue == null) {
		getLogger().error('Exec queue is not initialized')
		return ExecRequestResult.ERROR
	}
	const job = await queue.getJob(jobId)
	if (job != null) {
		return ExecRequestResult.ALREADY_RUNNING
	}
	const adder = getQueueAdder<ExecQueueData>('exec')
	if (adder == null) {
		getLogger().error('Exec queue adder is not initialized')
		return ExecRequestResult.ERROR
	}
	await adder(
		{
			jobId,
			request,
			resultCallback: callback,
		},
		{
			jobId,
			priority,
		},
	)
	return ExecRequestResult.QUEUED
}
