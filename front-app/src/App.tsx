import './App.css'

import { I18nProvider } from './common/utils/i18n'
import Router from './common/routing/Router'

function App() {
	return (
		<I18nProvider>
			<Router />
		</I18nProvider>
	)
}

export default App
