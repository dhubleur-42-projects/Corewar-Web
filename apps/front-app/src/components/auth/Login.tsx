import { useCallback, useEffect } from 'react'
import useStore from '../../common/store/store'
import { useNavigate } from 'react-router'
import { Button, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../common/utils/i18n'
import {
	useFetchAuthLink,
	useFetchMe,
} from '../../common/queries/useAuthQueries'

const i18n = defineI18n({
	en: {
		login: 'Login with 42',
	},
	fr: {
		login: 'Se connecter avec 42',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
})
function Login() {
	const navigate = useNavigate()
	const translate = useTranslate()

	const user = useStore((state) => state.user)
	const setUser = useStore((state) => state.setUser)

	useEffect(() => {
		if (user != null) {
			navigate('/dashboard/home', { replace: true })
		}
	}, [user, navigate])

	const { isSuccess: fetchMeSuccess, data: fetchMeData } = useFetchMe()

	useEffect(() => {
		if (fetchMeSuccess) {
			setUser(fetchMeData.user)
			navigate('/dashboard/home', { replace: true })
		}
	}, [fetchMeSuccess, fetchMeData, setUser, navigate])

	const { isSuccess: authLinkSuccess, data: authLinkData } =
		useFetchAuthLink()

	const handleLogin = useCallback(() => {
		window.location.href = authLinkData!.url
	}, [authLinkData])

	return (
		<Container>
			<Button
				variant="contained"
				onClick={handleLogin}
				disabled={!authLinkSuccess}
			>
				{translate(i18n.login)}
			</Button>
		</Container>
	)
}

export default Login
