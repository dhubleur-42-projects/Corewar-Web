class EnvValues {
	get(key: string, val?: string) {
		const viteKey = `VITE_${key}`
		const value = val ?? (import.meta.env[viteKey] as string | undefined)

		return {
			default: (defaultValue: string) => {
				return this.get(key, value ?? defaultValue)
			},
			asString: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${viteKey} is not defined.`,
					)
				}
				return String(value)
			},
			asNumber: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${viteKey} is not defined.`,
					)
				}
				const numValue = Number(value)
				if (isNaN(numValue)) {
					throw new Error(
						`The environment variable ${viteKey} must be a number.`,
					)
				}
				return numValue
			},
			asBoolean: () => {
				if (value === undefined) {
					throw new Error(
						`The environment variable ${viteKey} is not defined.`,
					)
				}
				if (typeof value === 'boolean') {
					return value
				}
				if (['true', 'false'].includes(value)) {
					return value === 'true'
				}
				throw new Error(
					`The environment variable ${viteKey} must be a boolean (true or false).`,
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
	apiUrl: envValues.get('API_URL').asString(),
}

export default config
