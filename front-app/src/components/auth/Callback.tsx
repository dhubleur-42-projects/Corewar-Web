import { styled } from '@mui/material'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useExchangeToken } from '../../common/queries/useAuthQueries'
import useStore from '../../common/store/store'

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

	const { mutate: exchangeTokeMutate } = useExchangeToken()

	const user = useStore((state) => state.user)
	const setUser = useStore((state) => state.setUser)

	useEffect(() => {
		if (user != null) {
			navigate('/dashboard/home', { replace: true })
			return
		}
	}, [user, navigate])

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
			<p>Processing authentication...</p>
		</Container>
	)
}

export default Callback
