import { useEffect } from 'react'
import useStore from '../../common/store/store'
import { defineI18n, useTranslate } from '../../common/utils/i18n'

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

	useEffect(() => {
		connect()
		return () => {
			disconnect()
		}
	}, [connect, disconnect])

	const translate = useTranslate()
	return <p>{translate(i18n.home)}</p>
}

export default Home
