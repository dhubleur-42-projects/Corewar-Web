import { Helmet } from 'react-helmet'
import { defineI18n, useTranslate } from './common/utils/i18n'

const i18n = defineI18n({
	en: {
		title: 'My Website',
		description: 'Welcome to My Website',
	},
	fr: {
		title: 'Mon site Web',
		description: 'Bienvenue sur mon site Web',
	},
})

function Head() {
	const translate = useTranslate()

	return (
		<Helmet>
			<title>{translate(i18n.title)}</title>
			<meta name="description" content={translate(i18n.description)} />
		</Helmet>
	)
}

export default Head
