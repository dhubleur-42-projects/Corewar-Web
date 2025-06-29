import './App.css'

import { I18nProvider } from './common/utils/i18n'
import config from './common/utils/config'

function App() {
	return <I18nProvider>{config.apiUrl}</I18nProvider>
}

export default App
