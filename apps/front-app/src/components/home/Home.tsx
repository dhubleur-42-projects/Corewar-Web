import { defineI18n, useTranslate } from '../../common/utils/i18n'
import TmpExample from './TmpExample'
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
	return (
		<>
			<p>{translate(i18n.home)}</p>
			<TmpExample />
		</>
	)
}

export default Home
