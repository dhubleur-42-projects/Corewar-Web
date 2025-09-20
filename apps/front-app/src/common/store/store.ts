import { create } from 'zustand'
import createUserSlice from './userSlice'
import createLocaleSlice from './localeSlice'
import createSocketSlice from './socketSlice'

type StoreState = ReturnType<typeof createUserSlice> &
	ReturnType<typeof createLocaleSlice> &
	ReturnType<typeof createSocketSlice>

const useStore = create<StoreState>()((...a) => ({
	...createUserSlice(...a),
	...createLocaleSlice(...a),
	...createSocketSlice(...a),
}))

export default useStore
