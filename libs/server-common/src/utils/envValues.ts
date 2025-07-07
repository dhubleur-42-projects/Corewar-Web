import 'dotenv/config'

class EnvValues {
	get(key: string, val?: string) {
		const value = val ?? process.env[key]

		return {
			default: (defaultValue: string) => {
				return this.get(key, value ?? defaultValue)
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
			asEnum: <T extends Record<string, unknown>>(enumType: T) => {
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
			asArray: <T>(separator = ',') => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${key} is not defined.`,
					)
				}
				if (typeof value !== 'string') {
					throw new Error(
						`The environment variable ${key} must be a string.`,
					)
				}
				return value.split(separator).map((item) => item.trim()) as T[]
			},
		}
	}
}

export default EnvValues
