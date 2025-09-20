import { useCallback, useEffect, useRef } from 'react'
import {
	ExecRequestError,
	ExecRequestResult,
	ExecRequestTimeoutError,
	useExec,
	type ExecResult,
} from '../../common/contexts/ExecContext'
import { toast } from 'react-toastify'

function TmpExample() {
	const {
		connect,
		disconnect,
		runRequest,
		registerResultListener,
		removeResultListener,
	} = useExec()

	const codeRef = useRef<HTMLInputElement>(null)

	const resultListener = useCallback((result: ExecResult) => {
		if (result.exitCode === 0) {
			toast.success(`Execution succeeded: ${result.stdout}`)
		} else {
			toast.error(`Execution failed: ${result.stderr}`)
		}
	}, [])

	useEffect(() => {
		connect()
		registerResultListener('tmp-example', resultListener)
		return () => {
			disconnect()
			removeResultListener('tmp-example')
		}
	}, [
		connect,
		disconnect,
		registerResultListener,
		removeResultListener,
		resultListener,
	])

	const handleRun = async () => {
		if (codeRef.current) {
			const code = codeRef.current.value
			try {
				await runRequest(code)
				toast.success('Request queued successfully')
			} catch (error) {
				if (error instanceof ExecRequestError) {
					if (error.message === ExecRequestResult.ALREADY_RUNNING) {
						toast.error('A request is already running')
						return
					}
					if (error.message === ExecRequestResult.ERROR) {
						toast.error(
							'An error occurred while processing the request',
						)
						return
					}
				}
				if (error instanceof ExecRequestTimeoutError) {
					toast.error('The request timed out')
					return
				}
				throw error
			}
		}
	}

	return (
		<div>
			<input type="text" placeholder="Code" ref={codeRef} />
			<button onClick={handleRun}>Run</button>
			<p>
				If code contains &ldquo;error&ldquo;, the run result will be an
				error
			</p>
		</div>
	)
}

export default TmpExample
