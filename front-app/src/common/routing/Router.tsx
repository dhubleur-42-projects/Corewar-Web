import { BrowserRouter, Navigate, Routes, Route } from 'react-router'
import Dashboard from '../../components/dashboard/Dashboard'
import Home from '../../components/home/Home'
import Login from '../../components/auth/Login'
import Callback from '../../components/auth/Callback'

function RouterContent() {
	return (
		<Routes>
			<Route path="/" element={<Login />} />
			<Route path="/callback" element={<Callback />} />
			<Route path="/dashboard" element={<Dashboard />}>
				<Route path="home" element={<Home />} />
				<Route
					path="*"
					element={<Navigate to="/dashboard/home" replace />}
				/>
			</Route>
			<Route path="*" element={<Navigate to="/" replace />} />
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
