import { useEffect } from 'react'
import useStore from '../../common/store/store'
import { defineI18n, useTranslate } from '../../common/utils/i18n'
import { useFetchExecToken } from '../../common/queries/useExecQueries'
import { toast } from 'react-toastify'
import {
	ExecRequestError,
	ExecRequestResult,
	ExecRequestTimeoutError,
} from '../../common/store/socketSlice'

const i18n = defineI18n({
	en: {
		home: 'Home',
	},
	fr: {
		home: 'Accueil',
	},
})

function Home() {
	const { connect, disconnect, runRequest } = useStore()

	const { isSuccess: fetchExecTokenSuccess, data: fetchExecTokenData } =
		useFetchExecToken()

	useEffect(() => {
		const run = async () => {
			try {
				await runRequest('Hello world')
				toast.success('Code queued successfully')
			} catch (error) {
				if (error instanceof ExecRequestError) {
					switch (error.message) {
						case ExecRequestResult.ALREADY_RUNNING:
							toast.error('A request is already running')
							break
						case ExecRequestResult.ERROR:
							toast.error(
								'An error occurred while executing the code',
							)
							break
					}
				} else if (error instanceof ExecRequestTimeoutError) {
					toast.error('Request timed out')
				} else {
					throw error
				}
			}
		}

		if (fetchExecTokenSuccess) {
			connect(fetchExecTokenData.token)
			run()
		}
		return () => {
			disconnect()
		}
	}, [
		connect,
		disconnect,
		fetchExecTokenSuccess,
		fetchExecTokenData,
		runRequest,
	])

	const translate = useTranslate()
	return <p>{translate(i18n.home)}</p>
}

export default Home
