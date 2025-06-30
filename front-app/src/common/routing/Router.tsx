import { BrowserRouter, Navigate, Routes, Route } from 'react-router'
import Dashboard from '../../components/dashboard/Dashboard'
import Home from '../../components/home/Home'

function RouterContent() {
	return (
		<Routes>
			<Route path="/" element={<Dashboard />}>
				<Route index element={<Navigate to="/home" />} />
				<Route path="home" element={<Home />} />
			</Route>
		</Routes>
	)
}

function Router() {
	return (
		<BrowserRouter>
			<RouterContent />
		</BrowserRouter>
	)
}

export default Router
