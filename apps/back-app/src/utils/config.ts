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
	apiClientId: envValues.get('42_API_CLIENT_ID').asString(),
	apiClientSecret: envValues.get('42_API_CLIENT_SECRET').asString(),
	frontUrl: envValues
		.get('FRONT_URL')
		.default('http://localhost:8080')
		.asString(),
	jwtSecret: envValues.get('JWT_SECRET').asString(),
	jwtIssuer: envValues.get('JWT_ISSUER').asString(),
	accessTokenValidity: envValues
		.get('ACCESS_TOKEN_VALIDITY_SEC')
		.default('3600') // 1 hour
		.asNumber(),
	accessTokenCookieName: envValues
		.get('ACCESS_TOKEN_COOKIE_NAME')
		.default('accessToken')
		.asString(),
	rememberMeValidity: envValues
		.get('REMEMBER_ME_VALIDITY_SEC')
		.default('2592000') // 30 days
		.asNumber(),
	rememberMeCookieName: envValues
		.get('REMEMBER_ME_COOKIE_NAME')
		.default('rememberMeToken')
		.asString(),
	cookieConfig: {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: envValues.get('IS_PROD').default('false').asBoolean(),
		...(envValues.get('IS_PROD').default('false').asBoolean()
			? { domain: envValues.get('COOKIE_DOMAIN').asString() }
			: {}),
		path: '/',
		withCredentials: true,
	},
	redisHost: envValues.get('REDIS_HOST').asString(),
	redisPort: envValues.get('REDIS_PORT').default('6379').asNumber(),
	redisPassword: envValues.get('REDIS_PASSWORD').asString(),
	authorizedIssuers: envValues.get('AUTHORIZED_ISSUERS').asArray<string>(),
	privateKetValidityTime: envValues
		.get('PRIVATE_KEY_VALIDITY')
		.default('86400000')
		.asNumber(),
}

export default config
