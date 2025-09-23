import { Outlet, useNavigate } from 'react-router'
import useStore from '../../common/store/store'
import { useEffect } from 'react'
import { useFetchMe } from '../../common/queries/useAuthQueries'
import { styled } from '@mui/material'
import UserMenu from './UserMenu'

const HEADER_HEIGHT = 60

const Header = styled('div')({
	backgroundColor: '#f5f5f5',
	height: HEADER_HEIGHT,
	padding: 10,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	alignItems: 'center',
	gap: 16,
})

const Content = styled('div')({
	height: `calc(100% - ${HEADER_HEIGHT}px)`,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
})

function Dashboard() {
	const navigate = useNavigate()

	const {
		isLoading: fetchMeLoading,
		isSuccess: fetchMeSuccess,
		data: fetchMeData,
	} = useFetchMe()

	const { user, isUserFromCache, setUser, setLocale } = useStore()

	const isUserDefined = user != null

	useEffect(() => {
		if (!isUserDefined || isUserFromCache) {
			if (fetchMeLoading) {
				return
			}
			if (fetchMeSuccess) {
				setUser(fetchMeData.user)
				setLocale(fetchMeData.user.locale as 'en' | 'fr')
				return
			}
			navigate('/', {
				replace: true,
			})
		}
	}, [
		isUserDefined,
		isUserFromCache,
		navigate,
		fetchMeLoading,
		fetchMeSuccess,
		fetchMeData,
		setUser,
		setLocale,
	])

	return (
		<>
			<Header>
				<UserMenu />
			</Header>
			<Content>
				<Outlet />
			</Content>
		</>
	)
}

export default Dashboard
