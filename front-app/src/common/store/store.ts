import { create } from 'zustand'
import createUserSlice from './userSlice'

type StoreState = ReturnType<typeof createUserSlice>
// & ReturnType<typeof xSlice>

const useStore = create<StoreState>()((set) => ({
	...createUserSlice(set),
}))

export default useStore
