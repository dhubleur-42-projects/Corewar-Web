import { getSubLogger } from 'server-common'
import { TransactionClient } from '../../plugins/transaction'

async function expireRememberMeJob(transaction: TransactionClient) {
	const logger = getSubLogger('EXPIRE REMEMBER ME JOB')
	const res = await transaction.rememberMe.deleteMany({
		where: {
			expiresAt: {
				lte: new Date(),
			},
		},
	})
	if (res.count > 0) {
		logger.info(`Expired ${res.count} remember me tokens`)
	}
}

export default expireRememberMeJob
