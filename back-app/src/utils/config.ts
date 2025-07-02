import 'dotenv/config'

import { LoggerLevel } from './logger'

class EnvValues {
	get(key: string) {
		let value = process.env[key]

		return {
			default: (defaultValue: string) => {
				value = value !== undefined ? value : defaultValue
				return this.get(key)
			},
			asString: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${key} is not defined.`,
					)
				}
				return String(value)
			},
			asNumber: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${key} is not defined.`,
					)
				}
				const numValue = Number(value)
				if (isNaN(numValue)) {
					throw new Error(
						`The environment variable ${key} must be a number.`,
					)
				}
				return numValue
			},
			asBoolean: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${key} is not defined.`,
					)
				}
				if (typeof value === 'boolean') {
					return value
				}
				if (['true', 'false'].includes(value)) {
					return value === 'true'
				}
				throw new Error(
					`The environment variable ${key} must be a boolean (true or false).`,
				)
			},
			asEnum: <T extends Record<string, any>>(enumType: T) => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${key} is not defined.`,
					)
				}
				const enumValues = Object.values(enumType)
				if (!enumValues.includes(value)) {
					throw new Error(
						`The environment variable ${key} must be one of ${enumValues.join(
							', ',
						)}.`,
					)
				}
				return value as T[keyof T]
			},
		}
	}
}

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
}

export default config
