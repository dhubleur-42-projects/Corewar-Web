import { Outlet, useNavigate } from 'react-router'
import useStore from '../../common/store/store'
import { useCallback, useEffect, useRef } from 'react'
import {
	useFetchMe,
	useLogout,
	useResetFetchMe,
} from '../../common/queries/useAuthQueries'
import { Button, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../common/utils/i18n'

const i18n = defineI18n({
	en: {
		logout: 'Logout',
		hello: 'Hello {name}',
	},
	fr: {
		logout: 'Se déconnecter',
		hello: 'Bonjour {{name}}',
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
	gap: 16,
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
	const translate = useTranslate()

	const {
		isLoading: fetchMeLoading,
		isSuccess: fetchMeSuccess,
		data: fetchMeData,
	} = useFetchMe()
	const resetFetchMe = useResetFetchMe()

	const { user, isUserFromCache, setUser } = useStore()

	const isUserDefined = user != null

	const logoutRef = useRef(false)

	useEffect(() => {
		if (!isUserDefined || isUserFromCache) {
			if (fetchMeLoading) {
				return
			}
			if (fetchMeSuccess && logoutRef.current === false) {
				setUser(fetchMeData.user)
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
	])

	const { mutate: logoutMutate } = useLogout()

	const handleLogout = useCallback(() => {
		logoutMutate(undefined, {
			onSuccess: () => {
				resetFetchMe()
				logoutRef.current = true
				setUser(null)
				navigate('/', { replace: true })
			},
		})
	}, [logoutMutate, setUser, navigate, resetFetchMe])

	return (
		<>
			<Header>
				<p>{translate(i18n.hello, { name: user?.login })}</p>
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
