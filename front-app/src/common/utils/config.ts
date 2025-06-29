class EnvValues {
	get(key: string) {
		const viteKey = `VITE_${key}`
		let value = import.meta.env[viteKey] as string | undefined

		return {
			default: (defaultValue: string) =>
				(value = value !== undefined ? value : defaultValue),
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
		}
	}
}

const envValues = new EnvValues()

const config = {
	apiUrl: envValues.get('API_URL').asString(),
}

export default config
