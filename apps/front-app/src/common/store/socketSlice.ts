import { io, Socket } from 'socket.io-client'
import type { StateCreator } from 'zustand'
import config from '../utils/config'

export interface SocketSlice {
	socket: Socket | null
	connect: (token: string) => void
	disconnect: () => void
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
})

export default createSocketSlice
