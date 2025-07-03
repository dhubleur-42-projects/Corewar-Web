import { Outlet, useLocation, useNavigate } from 'react-router'
import useStore from '../../common/store/store'
import { useEffect } from 'react'
import { useFetchMe } from '../../common/queries/useAuthQueries'

function Dashboard() {
	const navigate = useNavigate()
	const location = useLocation()

	const fetchMeQuery = useFetchMe()

	const user = useStore((state) => state.user)
	const setUser = useStore((state) => state.setUser)

	useEffect(() => {
		if (user == null) {
			if (fetchMeQuery.isLoading) {
				return
			}
			if (fetchMeQuery.isSuccess) {
				setUser(fetchMeQuery.data.user)
				return
			}
			navigate('/', {
				replace: true,
			})
		}
	}, [user, navigate, location, fetchMeQuery, setUser])

	return <Outlet />
}

export default Dashboard
