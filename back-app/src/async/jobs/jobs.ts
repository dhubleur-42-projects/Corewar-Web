import { Queue } from 'bullmq'
import { FastifyInstance } from 'fastify'
import expireRememberMeJob from './expireRememberMeJob'
import { getSubLogger } from '../../utils/logger'

type jobHandler = (fastify: FastifyInstance) => Promise<void>

interface JobsQueueData {
	handlerName: string
}

const jobHandlersByName: Record<string, jobHandler> = {}

let jobsQueue: Queue

const queueKey = 'jobsQueue'

export async function initJobs(fastify: FastifyInstance) {
	initJobsQueue(fastify)

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
		expireRememberMeJob,
	)
}

function initJobsQueue(fastify: FastifyInstance) {
	jobsQueue = fastify.createQueue<JobsQueueData>(queueKey, {
		attempts: 1,
	})
}

async function addJob(
	fastify: FastifyInstance,
	name: string,
	cron: string,
	handler: jobHandler,
) {
	if (jobsQueue == null) {
		throw new Error('jobsQueue is not initialized')
	}

	jobHandlersByName[handler.name] = handler

	const job = await jobsQueue.upsertJobScheduler(
		name,
		{ pattern: cron },
		{
			name,
			data: { handlerName: handler.name },
			opts: {
				backoff: 0,
				attempts: 1,
			},
		},
	)

	fastify.createWorker<JobsQueueData>(queueKey, createJobsWorker(fastify))

	return job
}

function createJobsWorker(fastify: FastifyInstance) {
	const logger = getSubLogger('JOBS WORKER')
	return async (job: unknown) => {
		const typedJob = job as { data: JobsQueueData; name: string }
		try {
			if (typedJob.data == null || typedJob.data.handlerName == null) {
				return
			}
			logger.debug(`Processing job ${typedJob.name}`)
			await jobHandlersByName[typedJob.data.handlerName](fastify)
			logger.debug(`Job processed successfully: ${typedJob.name}`)
		} catch (error) {
			logger.error(`Error processing job: ${typedJob.name}`, error)
		}
	}
}
