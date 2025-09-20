import { useMutation } from '@tanstack/react-query'
import { generateFetchApi } from './queries'

interface ExecTokenResponse {
	token: string
}

const fetchExecToken = generateFetchApi<[], ExecTokenResponse>('/exec/token', {
	method: 'GET',
})

export const useExecToken = () => {
	const mutation = useMutation({
		mutationFn: fetchExecToken,
	})

	return mutation
}
