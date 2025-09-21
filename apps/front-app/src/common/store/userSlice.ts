import { type StateCreator } from 'zustand'

const cachedUsedKey = 'cachedUser'

interface User {
	id: string
	username: string
}

interface UserState {
	user: User | null
	setUser: (user: User | null) => void
	isUserFromCache: boolean
}

const createUserSlice: StateCreator<UserState> = (set) => {
	const cached = localStorage.getItem(cachedUsedKey)

	return {
		user: cached != null ? JSON.parse(cached) : null,
		isUserFromCache: cached != null,
		setUser: (user: User | null, fromCache = false) => {
			if (user == null) {
				localStorage.removeItem(cachedUsedKey)
			} else {
				localStorage.setItem(cachedUsedKey, JSON.stringify(user))
			}
			set({ user, isUserFromCache: fromCache })
		},
	}
}

export default createUserSlice
