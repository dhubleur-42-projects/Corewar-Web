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
	const translate = useTranslate()
	return <p>{translate(i18n.home)}</p>
}

export default Home
