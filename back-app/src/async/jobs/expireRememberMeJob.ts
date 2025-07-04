import { FastifyInstance } from 'fastify'
import { getSubLogger } from '../../utils/logger'

async function expireRememberMeJob(fastify: FastifyInstance) {
	const logger = getSubLogger('EXPIRE REMEMBER ME JOB')
	// eslint-disable-next-line no-restricted-properties
	await fastify.prisma.$transaction(async (prisma) => {
		const res = await prisma.rememberMe.deleteMany({
			where: {
				expiresAt: {
					lte: new Date(),
				},
			},
		})
		if (res.count > 0) {
			logger.info(`Expired ${res.count} remember me tokens`)
		}
	})
}

export default expireRememberMeJob
