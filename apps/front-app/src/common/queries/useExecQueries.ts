import { useQuery } from '@tanstack/react-query'
import { generateFetchApi } from './queries'

interface ExecTokenResponse {
	token: string
}

const fetchExecToken = generateFetchApi<[], ExecTokenResponse>('/exec/token', {
	method: 'GET',
})

export const useFetchExecToken = () => {
	return useQuery<ExecTokenResponse>({
		queryKey: ['fetchExecToken'],
		queryFn: fetchExecToken,
	})
}
