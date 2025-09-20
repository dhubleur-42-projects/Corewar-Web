import { useEffect } from 'react'
import useStore from '../../common/store/store'
import { defineI18n, useTranslate } from '../../common/utils/i18n'
import { useFetchExecToken } from '../../common/queries/useExecQueries'

const i18n = defineI18n({
	en: {
		home: 'Home',
	},
	fr: {
		home: 'Accueil',
	},
})

function Home() {
	const { connect, disconnect } = useStore()

	const { isSuccess: fetchExecTokenSuccess, data: fetchExecTokenData } =
		useFetchExecToken()

	useEffect(() => {
		if (fetchExecTokenSuccess) {
			connect(fetchExecTokenData.token)
		}
		return () => {
			disconnect()
		}
	}, [connect, disconnect, fetchExecTokenSuccess, fetchExecTokenData])

	const translate = useTranslate()
	return <p>{translate(i18n.home)}</p>
}

export default Home
