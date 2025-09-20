import { create } from 'zustand'
import createUserSlice from './userSlice'
import createLocaleSlice from './localeSlice'

type StoreState = ReturnType<typeof createUserSlice> &
	ReturnType<typeof createLocaleSlice>

const useStore = create<StoreState>()((...a) => ({
	...createUserSlice(...a),
	...createLocaleSlice(...a),
}))

export default useStore
