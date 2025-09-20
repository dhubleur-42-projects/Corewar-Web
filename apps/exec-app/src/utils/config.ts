import 'dotenv/config'

import { LoggerLevel } from 'server-common'
import { EnvValues } from 'server-common'

const envValues = new EnvValues()

const config = {
	port: envValues.get('PORT').default('3000').asNumber(),
	loggerKey: envValues.get('LOGGER_KEY').asString(),
	loggerLevel: envValues
		.get('LOGGER_LEVEL')
		.default('INFO')
		.asEnum(LoggerLevel),
	jwtIssuer: envValues.get('JWT_ISSUER').asString(),
	isProd: envValues.get('IS_PROD').default('false').asBoolean(),
	redisHost: envValues.get('REDIS_HOST').asString(),
	redisPort: envValues.get('REDIS_PORT').default('6379').asNumber(),
	redisPassword: envValues.get('REDIS_PASSWORD').asString(),
	redisPrefix: envValues.get('REDIS_PREFIX').default('back-app').asString(),
	authorizedIssuers: envValues.get('AUTHORIZED_ISSUERS').asArray<string>(),
	privateKeyValidityTime: envValues
		.get('PRIVATE_KEY_VALIDITY')
		.default('86400000')
		.asNumber(),
	corsUrls: envValues.get('CORS_URLS').asArray<string>(),
	concurrencyLimit: envValues
		.get('CONCURRENCY_LIMIT')
		.default('5')
		.asNumber(),
}

export default config
