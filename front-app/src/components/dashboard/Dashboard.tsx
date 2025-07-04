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

	const {
		isLoading: fetchMeLoading,
		isSuccess: fetchMeSuccess,
		data: fetchMeData,
	} = useFetchMe()

	const user = useStore((state) => state.user)
	const setUser = useStore((state) => state.setUser)

	useEffect(() => {
		if (user == null) {
			if (fetchMeLoading) {
				return
			}
			if (fetchMeSuccess) {
				setUser(fetchMeData.user)
				return
			}
			navigate('/', {
				replace: true,
			})
		}
	}, [
		user,
		navigate,
		location,
		fetchMeLoading,
		fetchMeSuccess,
		fetchMeData,
		setUser,
	])

	const loguoutStore = useStore((state) => state.logout)
	const { mutate: logoutMutate } = useLogout()

	const handleLogout = useCallback(() => {
		logoutMutate(undefined, {
			onSuccess: () => {
				loguoutStore()
			},
			onError: (error) => {
				console.error('Logout failed:', error)
			},
		})
	}, [logoutMutate, loguoutStore])

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
