import { io, Socket } from "socket.io-client";
import type { StateCreator } from "zustand";
import config from "../utils/config";

export interface SocketSlice {
	socket: Socket | null
	connect: () => void
	disconnect: () => void
}

const createSocketSlice: StateCreator<SocketSlice> = (set, get) => ({
	socket: null,
	connect() {
		if (get().socket != null) return;
		const socket = io(config.execUrl, {
			auth: {
				token: '42'
			}
		})
		set({ socket })
	},
	disconnect() {
		if (get().socket == null) return;
		get().socket!.disconnect();
		set({ socket: null })
	}
})

export default createSocketSlice