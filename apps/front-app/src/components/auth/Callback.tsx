import { styled } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExchangeToken } from '../../common/queries/useAuthQueries'
import useStore from '../../common/store/store'
import { defineI18n, useTranslate } from '../../common/utils/i18n'

const i18n = defineI18n({
	en: {
		authInProgress: 'Processing authentication...',
	},
	fr: {
		authInProgress: "Traitement de l'authentification...",
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	height: '100%',
})

function Callback() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const translate = useTranslate()

	const { mutate: exchangeTokeMutate } = useExchangeToken()

	const { user, isUserFromCache, setUser } = useStore()

	useEffect(() => {
		if (user != null && !isUserFromCache) {
			navigate('/dashboard/home', { replace: true })
			return
		}
	}, [user, navigate, isUserFromCache])

	useEffect(() => {
		const code = searchParams.get('code')
		if (code != null) {
			exchangeTokeMutate(code, {
				onSuccess: (data) => {
					setUser(data.user)
					navigate('/dashboard/home', { replace: true })
				},
				onError: (error) => {
					console.error('Authentication failed:', error)
					navigate('/', { replace: true })
				},
			})
		} else {
			navigate('/', { replace: true })
		}
	}, [searchParams, navigate, exchangeTokeMutate, setUser])

	return (
		<Container>
			<p>{translate(i18n.authInProgress)}</p>
		</Container>
	)
}

export default Callback
