interface User {
	id: string
	login: string
}

interface UserState {
	user: User | null
	setUser: (user: User | null) => void
	logout: () => void
}

const createUserSlice = (set: any): UserState => ({
	user: null,
	setUser: (user: User | null) => set({ user }),
	logout: () => set({ user: null }),
})

export default createUserSlice
