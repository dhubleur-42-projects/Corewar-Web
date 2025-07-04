import { Outlet, useLocation, useNavigate } from 'react-router'
import useStore from '../../common/store/store'
import { useCallback, useEffect } from 'react'
import { useFetchMe, useLogout } from '../../common/queries/useAuthQueries'
import { Button, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../common/utils/i18n'

const i18n = defineI18n({
	en: {
		logout: 'Logout',
	},
})

const Header = styled('div')({
	backgroundColor: '#f5f5f5',
	height: 60,
	padding: 10,
	display: 'flex',
	flexDirection: 'row',
	justifyContent: 'flex-end',
	alignItems: 'center',
})

const Content = styled('div')({
	height: '100%',
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	alignItems: 'center',
})

function Dashboard() {
	const navigate = useNavigate()
	const location = useLocation()
	const translate = useTranslate()

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

	const loguoutStore = useStore((state) => state.logout)
	const { mutate } = useLogout()

	const handleLogout = useCallback(() => {
		mutate(undefined, {
			onSuccess: () => {
				loguoutStore()
			},
			onError: (error) => {
				console.error('Logout failed:', error)
			},
		})
	}, [mutate, loguoutStore])

	return (
		<>
			<Header>
				<Button variant="contained" size="small" onClick={handleLogout}>
					{translate(i18n.logout)}
				</Button>
			</Header>
			<Content>
				<Outlet />
			</Content>
		</>
	)
}

export default Dashboard
