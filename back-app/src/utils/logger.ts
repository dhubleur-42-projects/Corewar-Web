export enum LoggerLevel {
	DEBUG = 'DEBUG',
	INFO = 'INFO',
	WARN = 'WARN',
	ERROR = 'ERROR',
}

class Logger {
	private key: string
	private level: LoggerLevel

	constructor(key: string, level: LoggerLevel) {
		this.key = key
		this.level = level
	}

	public getKey(): string {
		return this.key
	}

	public getLevel(): LoggerLevel {
		return this.level
	}

	public log(level: LoggerLevel, ...args: any[]): void {
		if (this.shouldLog(level)) {
			const lightGrey = '\x1b[37m'
			const cyan = '\x1b[36m'
			const reset = '\x1b[0m'

			let levelColor: string
			switch (level) {
				case LoggerLevel.DEBUG:
					levelColor = '\x1b[34m' // Blue
					break
				case LoggerLevel.INFO:
					levelColor = '\x1b[32m' // Green
					break
				case LoggerLevel.WARN:
					levelColor = '\x1b[33m' // Yellow
					break
				case LoggerLevel.ERROR:
					levelColor = '\x1b[31m' // Red
					break
				default:
					levelColor = '\x1b[37m' // Default to white
			}

			const date = new Date().toISOString()
			console.log(
				`${lightGrey}[${date}]${reset} ${cyan}[${this.key}]${reset} ${levelColor}[${level}]${reset}`,
				...args,
			)
		}
	}

	private shouldLog(level: LoggerLevel): boolean {
		const levels = Object.values(LoggerLevel)
		return levels.indexOf(level) >= levels.indexOf(this.level)
	}

	public debug(...args: any[]): void {
		this.log(LoggerLevel.DEBUG, ...args)
	}

	public info(...args: any[]): void {
		this.log(LoggerLevel.INFO, ...args)
	}

	public warn(...args: any[]): void {
		this.log(LoggerLevel.WARN, ...args)
	}

	public error(...args: any[]): void {
		this.log(LoggerLevel.ERROR, ...args)
	}
}

let loggerInstance: Logger | null = null

export function createLogger(
	key: string,
	level: LoggerLevel = LoggerLevel.INFO,
): Logger {
	if (!loggerInstance) {
		loggerInstance = new Logger(key, level)
	}
	return loggerInstance
}

export function getLogger(): Logger {
	if (!loggerInstance) {
		throw new Error(
			'Logger instance is not created. Use createLogger first.',
		)
	}
	return loggerInstance
}

export function getSubLogger(key: string): Logger {
	if (!loggerInstance) {
		throw new Error(
			'Logger instance is not created. Use createLogger first.',
		)
	}
	const subLogger = new Logger(
		`${loggerInstance.getKey()}][${key}`,
		loggerInstance.getLevel(),
	)
	return subLogger
}
