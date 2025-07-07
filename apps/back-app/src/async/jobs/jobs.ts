import { FastifyInstance } from 'fastify'
import expireRememberMeJob from './expireRememberMeJob'
import { addJob, JobHandler } from 'server-common'
import { TransactionClient } from '../../plugins/transaction'

type TransactionalJobHandler = (transaction: TransactionClient) => Promise<void>

export async function initJobs(fastify: FastifyInstance) {
	/*
		https://www.npmjs.com/package/cron-parser
		*    *    *    *    *    *
		┬    ┬    ┬    ┬    ┬    ┬
		│    │    │    │    │    │
		│    │    │    │    │    └─ day of week (0-7, 1L-7L) (0 or 7 is Sun)
		│    │    │    │    └────── month (1-12, JAN-DEC)
		│    │    │    └─────────── day of month (1-31, L)
		│    │    └──────────────── hour (0-23)
		│    └───────────────────── minute (0-59)
		└────────────────────────── second (0-59, optional)
	*/

	await addJob(
		fastify,
		'expireRememberMeJob',
		'0 0 0 * * *',
		getJobHandler(expireRememberMeJob),
	)
}

export function getJobHandler(handler: TransactionalJobHandler): JobHandler {
	return async (fastify: FastifyInstance) => {
		await fastify.prisma.$transaction(async (transaction) => {
			await handler(transaction)
		})
	}
}
