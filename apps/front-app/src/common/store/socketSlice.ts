import { io, Socket } from 'socket.io-client'
import type { StateCreator } from 'zustand'
import config from '../utils/config'

export enum ExecRequestResult {
	QUEUED = 'queued',
	ALREADY_RUNNING = 'already_running',
	ERROR = 'error',
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

export interface SocketSlice {
	socket: Socket | null
	connect: (token: string) => void
	disconnect: () => void
	runRequest: (code: string) => Promise<void>
}

const createSocketSlice: StateCreator<SocketSlice> = (set, get) => ({
	socket: null,
	connect(token: string) {
		if (get().socket != null) return
		const socket = io(config.execUrl, {
			auth: {
				token,
			},
		})
		socket.on('connect_error', (err) => {
			console.error('Socket connection error:', err.message)
		})
		socket.on('disconnect', (reason) => {
			console.warn('Socket disconnected:', reason)
			set({ socket: null })
		})
		set({ socket })
	},
	disconnect() {
		if (get().socket == null) return
		get().socket!.disconnect()
		set({ socket: null })
	},
	runRequest(code: string) {
		if (get().socket == null) {
			throw new Error('Socket is not connected')
		}
		return new Promise<void>((resolve, reject) => {
			get().socket!.emit(
				'exec',
				{ code },
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
			}, 10000)
		})
	},
})

export default createSocketSlice
