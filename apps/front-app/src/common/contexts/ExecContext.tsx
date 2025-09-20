import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	type ReactNode,
} from 'react'
import { jwtDecode } from 'jwt-decode'
import { useExecToken } from '../queries/useExecQueries'
import { io, Socket } from 'socket.io-client'
import config from '../utils/config'
import { toast } from 'react-toastify'

export enum ExecRequestResult {
	QUEUED = 'queued',
	ALREADY_RUNNING = 'already_running',
	ERROR = 'error',
}

export interface ExecResult {
	stdout: string
	stderr: string
	exitCode: number
}

export class ExecRequestError extends Error {
	constructor(
		message: ExecRequestResult.ALREADY_RUNNING | ExecRequestResult.ERROR,
	) {
		super(message)
		this.name = 'ExecRequestError'
	}
}

export class ExecRequestTimeoutError extends Error {
	constructor() {
		super('Request timed out')
		this.name = 'ExecRequestTimeoutError'
	}
}

type ExecContextType = {
	connect: () => void
	disconnect: () => void
	runRequest: (code: string) => Promise<void>
	registerResultListener: (
		id: string,
		callback: (result: ExecResult) => void,
	) => void
	removeResultListener: (id: string) => void
}

const ExecContext = createContext<ExecContextType | null>(null)

type JwtPayload = {
	exp: number
	iat?: number
	[key: string]: unknown
}

function isTokenExpired(token: string): boolean {
	try {
		const decoded = jwtDecode<JwtPayload>(token)
		if (!decoded.exp) return false

		const now = Date.now() / 1000
		return decoded.exp < now + 60
	} catch {
		return true
	}
}

function getTokenExpirationDelayMs(token: string): number {
	try {
		const decoded = jwtDecode<JwtPayload>(token)
		if (!decoded.exp) return 0

		const now = Date.now() / 1000
		const delaySeconds = decoded.exp - now
		return delaySeconds > 0 ? delaySeconds * 1000 : 0
	} catch {
		return 0
	}
}

export function ExecContextProvider({ children }: { children: ReactNode }) {
	const socketRef = useRef<Socket | null>(null)
	const execTokenRef = useRef<string | null>(null)
	const listenersMapRef = useRef<Map<string, (data: any) => void>>(new Map())
	const pingIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(
		null,
	)
	const renewTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const pingTimeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const { mutateAsync: getNewToken } = useExecToken()

	useEffect(() => {
		pingIntervalIdRef.current = setInterval(() => {
			if (socketRef.current != null && socketRef.current.connected) {
				socketRef.current.emit('ping', {}, (response: string) => {
					if (pingTimeoutIdRef.current != null) {
						clearTimeout(pingTimeoutIdRef.current)
						pingTimeoutIdRef.current = null
					}
					if (response !== 'pong') {
						toast.error('Lost connection to exec server')
						socketRef.current?.disconnect()
						socketRef.current = null
					}
				})
				pingTimeoutIdRef.current = setTimeout(() => {
					toast.error('Lost connection to exec server')
					socketRef.current?.disconnect()
					socketRef.current = null
				}, 5_000)
			}
		}, 30_000) // Ping every 30 seconds

		return () => {
			if (pingIntervalIdRef.current != null) {
				clearInterval(pingIntervalIdRef.current)
			}
			if (renewTimeoutIdRef.current != null) {
				clearTimeout(renewTimeoutIdRef.current)
			}
		}
	}, [])

	const renewToken = useCallback(async () => {
		if (renewTimeoutIdRef.current != null) {
			clearTimeout(renewTimeoutIdRef.current)
			renewTimeoutIdRef.current = null
		}

		const newToken = (await getNewToken()).token
		if (newToken == null) {
			throw new Error('Failed to obtain exec token')
		}

		if (socketRef.current != null && socketRef.current.connected) {
			socketRef.current.emit('renewToken', { token: newToken })
		}

		renewTimeoutIdRef.current = setTimeout(
			async () => {
				await renewToken()
			},
			getTokenExpirationDelayMs(newToken) - 80_000, // Renew 80s before expiration
		)

		execTokenRef.current = newToken
	}, [getNewToken])

	const renewTokenIfNeeded = useCallback(async () => {
		if (execTokenRef.current != null) {
			if (!isTokenExpired(execTokenRef.current)) {
				return
			}
		}

		await renewToken()
	}, [renewToken])

	const connect = useCallback(async () => {
		if (socketRef.current != null) return
		await renewTokenIfNeeded()
		if (execTokenRef.current == null) {
			throw new Error('Failed to obtain exec token')
		}

		const socket = io(config.execUrl, {
			auth: {
				token: execTokenRef.current,
			},
			autoConnect: true,
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 2_000,
		})
		socket.on('connect_error', (err) => {
			console.error('Socket connection error:', err.message)
		})
		socket.on('disconnect', (reason) => {
			console.warn('Socket disconnected:', reason)
		})
		socket.on('connect', () => {
			console.info('Socket connected')
		})
		socket.io.on('reconnect', async () => {
			console.info('Socket reconnected')
		})

		socket.on('execResult', (result: ExecResult) => {
			listenersMapRef.current.forEach((callback) => {
				callback(result)
			})
		})
		socketRef.current = socket
	}, [renewTokenIfNeeded])

	const disconnect = useCallback(() => {
		if (socketRef.current != null) {
			socketRef.current.disconnect()
			socketRef.current = null
		}
		if (renewTimeoutIdRef.current != null) {
			clearTimeout(renewTimeoutIdRef.current)
			renewTimeoutIdRef.current = null
		}
	}, [])

	const runRequest = useCallback(async (code: string) => {
		if (socketRef.current == null || !socketRef.current.connected) {
			throw new Error('Socket is not connected')
		}
		return new Promise<void>((resolve, reject) => {
			socketRef.current!.emit(
				'exec',
				{ code, type: 'compiler' },
				(response: { result: ExecRequestResult }) => {
					if (response.result === ExecRequestResult.QUEUED) {
						resolve()
					} else {
						reject(new ExecRequestError(response.result))
					}
				},
			)
			setTimeout(() => {
				reject(new ExecRequestTimeoutError())
			}, 10_000)
		})
	}, [])

	const registerResultListener = useCallback(
		(id: string, callback: (result: ExecResult) => void) => {
			if (listenersMapRef.current.has(id)) {
				throw new Error(`Listener with id ${id} already exists`)
			}
			listenersMapRef.current.set(id, callback)
		},
		[],
	)

	const removeResultListener = useCallback((id: string) => {
		const listener = listenersMapRef.current.get(id)
		if (listener != null) {
			listenersMapRef.current.delete(id)
		}
	}, [])

	return (
		<ExecContext.Provider
			value={{
				connect,
				disconnect,
				runRequest,
				registerResultListener,
				removeResultListener,
			}}
		>
			{children}
		</ExecContext.Provider>
	)
}

export function useExec() {
	const context = useContext(ExecContext)
	if (context == null) {
		throw new Error('useExec must be used within an ExecContextProvider')
	}
	return context
}
