import React, { useState, useCallback, useRef, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import useStore from '../../../common/store/store'
import type { UseFormReturn } from 'react-hook-form'
import type { UserFormData } from './UserProfile'
import { Button, Dialog, styled } from '@mui/material'
import { defineI18n, useTranslate } from '../../../common/utils/i18n'

const i18n = defineI18n({
	en: {
		cancel: 'Cancel',
		validate: 'Validate',
	},
	fr: {
		cancel: 'Annuler',
		validate: 'Valider',
	},
})

const Container = styled('div')({
	display: 'flex',
	flexDirection: 'row',
	alignItems: 'center',
	gap: 10,
})

const DialogContainer = styled('div')({
	position: 'relative',
	background: '#333',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	justifyContent: 'center',
	gap: 10,
	padding: 20,
	height: 400,
})

const CropperContainer = styled('div')({
	position: 'relative',
	width: '100%',
	height: 300,
})

const ButtonsContainer = styled('div')({
	display: 'flex',
	justifyContent: 'space-between',
	width: '100%',
	marginTop: 10,
})

interface ProfilePictureUploaderProps {
	methods: UseFormReturn<UserFormData, any, UserFormData>
}

function ProfilePictureUploader({ methods }: ProfilePictureUploaderProps) {
	const translate = useTranslate()
	const { user } = useStore()

	const [cropDialogOpen, setCropDialogOpen] = useState(false)
	const [imageSrc, setImageSrc] = useState<string | undefined>(undefined)
	const [crop, setCrop] = useState({ x: 0, y: 0 })
	const [zoom, setZoom] = useState(1)
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)

	const canvasRef = useRef<HTMLCanvasElement>(null)

	const profilePicture = methods.watch('profilePicture')

	useEffect(() => {
		const canvas = canvasRef.current
		if (!canvas) return
		const ctx = canvas.getContext('2d')!
		const img = new Image()

		if (profilePicture instanceof File) {
			img.src = URL.createObjectURL(profilePicture)
		} else {
			img.src = user!.profilePictureUrl
		}

		img.onload = () => {
			const size = Math.min(img.width, img.height)
			ctx.clearRect(0, 0, canvas.width, canvas.height)
			ctx.drawImage(
				img,
				(img.width - size) / 2,
				(img.height - size) / 2,
				size,
				size,
				0,
				0,
				canvas.width,
				canvas.height,
			)
		}
	}, [profilePicture, user])

	const onCropComplete = useCallback((_: any, area: any) => {
		setCroppedAreaPixels(area)
	}, [])

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setImageSrc(URL.createObjectURL(e.target.files[0]))
			setCropDialogOpen(true)
		}
	}

	const validateCrop = async () => {
		if (!croppedAreaPixels || !imageSrc) return
		const canvas = document.createElement('canvas')
		const image = new Image()
		image.src = imageSrc
		await new Promise((r) => (image.onload = r))

		const { width, height, x, y } = croppedAreaPixels
		canvas.width = width
		canvas.height = height
		const ctx = canvas.getContext('2d')!
		ctx.drawImage(image, x, y, width, height, 0, 0, width, height)

		const blob = await new Promise<Blob>((resolve) =>
			canvas.toBlob((b) => resolve(b!), 'image/jpeg'),
		)

		const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
		methods.setValue('profilePicture', file, { shouldDirty: true })
		setCropDialogOpen(false)
	}

	return (
		<>
			<Container>
				<canvas
					ref={canvasRef}
					width={100}
					height={100}
					style={{ borderRadius: '50%' }}
				/>
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					style={{ display: 'block', marginTop: 10 }}
				/>
			</Container>
			<Dialog
				open={cropDialogOpen}
				onClose={() => setCropDialogOpen(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogContainer>
					<CropperContainer>
						<Cropper
							image={imageSrc}
							crop={crop}
							zoom={zoom}
							aspect={1}
							onCropChange={setCrop}
							onZoomChange={setZoom}
							onCropComplete={onCropComplete}
						/>
					</CropperContainer>
					<ButtonsContainer>
						<Button
							onClick={() => setCropDialogOpen(false)}
							color="secondary"
							variant="contained"
						>
							{translate(i18n.cancel)}
						</Button>
						<Button onClick={validateCrop} variant="contained">
							{translate(i18n.validate)}
						</Button>
					</ButtonsContainer>
				</DialogContainer>
			</Dialog>
		</>
	)
}

export default ProfilePictureUploader
