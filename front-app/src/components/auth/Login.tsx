import { useCallback, useEffect } from 'react'
import useStore from '../../common/store/store'
import { useNavigate } from 'react-router'
import { Button, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../common/utils/i18n'
import { useFetchAuthLink } from '../../common/queries/useAuthQueries'

const i18n = defineI18n({
	en: {
		login: 'Login with 42',
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

	useEffect(() => {
		if (user != null) {
			navigate('/dashboard/home', { replace: true })
		}
	}, [user, navigate])

	const authLinkQuery = useFetchAuthLink()

	const handleLogin = useCallback(() => {
		const data = authLinkQuery.data!
		window.location.href = data.url
	}, [authLinkQuery])

	return (
		<Container>
			<Button
				variant="contained"
				onClick={handleLogin}
				disabled={!authLinkQuery.isSuccess}
			>
				{translate(i18n.login)}
			</Button>
		</Container>
	)
}

export default Login
