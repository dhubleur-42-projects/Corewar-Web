import { FastifyPluginAsync } from 'fastify'
import { LocaleBody, LocaleSchema } from './schemas'
import path from 'path'
import { TransactionRequest } from '../../plugins/transaction'
import sharp from 'sharp'
import fs from 'fs'
import config from '../../utils/config'

const UPLOAD_PROFILE_PICTURE_DIR = `${config.uploadDir}/profile-pictures/`

function isImage(fileName: string, mimeType: string) {
	const ext = path.extname(fileName).toLowerCase()
	const allowedExt = ['.png', '.jpg', '.jpeg', '.webp']
	const allowedMime = ['image/png', 'image/jpeg', 'image/webp']
	return allowedExt.includes(ext) && allowedMime.includes(mimeType)
}

const userRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.securePost('/locale', {
		schema: LocaleSchema,
		handler: fastify.withTransaction(async (request, reply) => {
			const { locale } = request.body as LocaleBody
			const userId = request.userId!

			await request.transaction.user.update({
				where: { id: userId },
				data: { locale },
			})

			reply.status(200).send({ message: 'Locale updated' })
		}),
	})

	fastify.get('/profile-picture/:filename', async (request, reply) => {
		const { filename } = request.params as { filename: string }
		const filePath = path.join(UPLOAD_PROFILE_PICTURE_DIR, filename)

		if (!fs.existsSync(filePath)) {
			return reply.status(404).send({ error: 'File not found' })
		}

		reply.type('image/webp')

		reply.header('Cache-Control', 'public, max-age=86400') // 1 day
		reply.header('Pragma', 'public')

		return fs.createReadStream(filePath)
	})

	async function handleProfilePictureUpload(
		profilePictureFile: Buffer,
		profilePictureFilename: string,
		profilePictureMimeType: string,
		userId: string,
		request: TransactionRequest,
	) {
		if (!isImage(profilePictureFilename, profilePictureMimeType)) {
			return null
		}

		const compressed = await sharp(profilePictureFile)
			.resize(512, 512, { fit: 'cover' })
			.webp({ quality: 80 })
			.toBuffer()

		const fileName = `${userId}-${Date.now()}.webp`
		const filePath = path.join(UPLOAD_PROFILE_PICTURE_DIR, fileName)

		fs.mkdirSync(path.dirname(filePath), { recursive: true })
		fs.writeFileSync(filePath, compressed)

		const currentFileName = (
			await request.transaction.user.findUnique({
				where: { id: userId },
			})
		)?.profilePictureId

		const profilePictureUrl = `${config.selfUrl}/user/profile-picture/${fileName}`
		await request.transaction.user.update({
			where: { id: userId },
			data: {
				profilePictureUrl,
				profilePictureId: fileName,
			},
		})

		if (currentFileName != null) {
			const currentFilePath = path.join(
				UPLOAD_PROFILE_PICTURE_DIR,
				currentFileName,
			)
			if (fs.existsSync(currentFilePath)) {
				fs.unlinkSync(currentFilePath)
			}
		}

		return profilePictureUrl
	}

	fastify.securePost('/profile', {
		handler: fastify.withTransaction(async (request, reply) => {
			const parts = request.parts()

			let username: string | null = null
			let profilePictureFile: Buffer | null = null
			let profilePictureFilename: string | null = null
			let profilePictureMimeType: string | null = null

			for await (const part of parts) {
				if (
					part.type === 'file' &&
					part.fieldname === 'profilePicture'
				) {
					profilePictureFile = await part.toBuffer()
					profilePictureFilename = part.filename
					profilePictureMimeType = part.mimetype
				} else if (
					part.type === 'field' &&
					part.fieldname === 'username'
				) {
					username = String(part.value)
				}
			}
			if (username == null) {
				return reply.status(400).send({ error: 'Username is required' })
			}
			if (username.length < 5 || username.length > 20) {
				return reply
					.status(400)
					.send({ error: 'Invalid username length' })
			}
			if (profilePictureFile != null) {
				const imageUrl = await handleProfilePictureUpload(
					profilePictureFile,
					profilePictureFilename!,
					profilePictureMimeType!,
					request.userId!,
					request,
				)
				if (imageUrl == null) {
					return reply
						.status(400)
						.send({ error: 'Invalid profile picture' })
				}
			}

			const userId = request.userId!

			const isUsedUsername =
				(await request.transaction.user.findUnique({
					where: { username },
				})) != null

			if (isUsedUsername) {
				return reply
					.status(400)
					.send({ error: 'USERNAME_ALREADY_USED' })
			}

			const newUser = await request.transaction.user.update({
				where: { id: userId },
				data: { username },
			})

			reply.status(200).send({
				user: {
					id: newUser.id,
					username: newUser.username,
					role: newUser.role,
					profilePictureUrl: newUser.profilePictureUrl,
				},
			})
		}),
	})
}

export default userRoutes
