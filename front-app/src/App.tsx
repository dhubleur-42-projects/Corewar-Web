import './App.css'

import { I18nProvider } from './common/utils/i18n'
import Router from './common/routing/Router'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './common/queries/queries'

function App() {
	return (
		<I18nProvider>
			<QueryClientProvider client={queryClient}>
				<Router />
			</QueryClientProvider>
		</I18nProvider>
	)
}

export default App
