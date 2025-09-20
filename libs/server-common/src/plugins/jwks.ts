import { randomUUID } from 'crypto'
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import Redis, { RedisOptions } from 'ioredis'
import { getLogger } from '../utils/logger'
import * as jose from 'jose'

declare module 'fastify' {
	interface FastifyInstance {
		verifyRsaToken<T>(token: string): Promise<T>
		signRsaToken<T extends jose.JWTPayload>(
			payload: T,
			expirationTime: number,
			aud: string[] | string,
		): Promise<string>
		jwksStores: Record<string, jose.JWTVerifyGetKey>
		jwksRedis: Redis
		getRedisKey: (key: string) => string
	}
}

interface Key {
	key: jose.JWK
	validity: number
	kid: string
}

export interface KeyStore {
	keys: Key[]
}

export const publicKeysRedisKey = 'publicKeys'
export const privateKeyRedisKey = 'privateKey'

export const jwksAlg = 'RS256'

type SignOption = {
	privateKeyValidityTime: number
	publicKeyValidityTime: number
	issuer: string
}

type VerifyOption = {
	authorizedIssuers?: string[]
	selfAudience: string
}

const jwksPlugin: FastifyPluginAsync<{
	redisOptions: RedisOptions
	redisPrefix: string
	signOptions?: SignOption
	verifyOptions?: VerifyOption
}> = async (fastify, options) => {
	const { redisOptions, redisPrefix, signOptions, verifyOptions } = options
	const redis = new Redis(redisOptions)

	if (redis === null) {
		throw new Error('Redis connection failed')
	}

	fastify.decorate('getRedisKey', (key: string) => {
		return `${redisPrefix}:${key}`
	})

	fastify.decorate('jwksRedis', redis)

	async function generateKey() {
		if (signOptions == null) {
			throw new Error('Sign options are not provided')
		}
		const { publicKey, privateKey } = await jose.generateKeyPair(jwksAlg, {
			extractable: true,
		})

		const publicKeyJwt = await jose.exportJWK(publicKey)
		const privateKeyJwt = await jose.exportJWK(privateKey)

		const now = Date.now()
		const kid = randomUUID().toString()

		const currentKeys = JSON.parse(
			(await fastify.jwksRedis.get(
				fastify.getRedisKey(publicKeysRedisKey),
			)) || '{"keys": []}',
		) as KeyStore

		currentKeys.keys.push({
			key: publicKeyJwt,
			validity: now + signOptions.publicKeyValidityTime,
			kid: kid,
		})

		currentKeys.keys = currentKeys.keys.filter((k) => k.validity > now)

		getLogger().debug(
			`Generated new key, current keys count: ${currentKeys.keys.length}`,
		)

		await fastify.jwksRedis.set(
			fastify.getRedisKey(publicKeysRedisKey),
			JSON.stringify(currentKeys),
			'EX',
			signOptions.publicKeyValidityTime / 1000,
		)

		await fastify.jwksRedis.set(
			fastify.getRedisKey(privateKeyRedisKey),
			JSON.stringify({
				key: privateKeyJwt,
				validity: now + signOptions.privateKeyValidityTime,
				kid: kid,
			} as Key),
			'EX',
			signOptions.privateKeyValidityTime / 1000,
		)
	}

	fastify.decorate(
		'signRsaToken',
		async <T extends jose.JWTPayload>(
			payload: T,
			expirationTime: number,
			aud: string[] | string,
		): Promise<string> => {
			if (signOptions == null) {
				throw new Error('Sign options are not provided')
			}
			const privateKeyData = JSON.parse(
				(await fastify.jwksRedis.get(
					fastify.getRedisKey(privateKeyRedisKey),
				)) || '{}',
			) as Key
			if (
				privateKeyData == null ||
				privateKeyData.key == null ||
				privateKeyData.validity < Date.now()
			) {
				getLogger().debug(
					'Private key is invalid or expired, generating new key',
				)
				await generateKey()
				return fastify.signRsaToken(payload, expirationTime, aud)
			}
			const token = new jose.SignJWT(payload)
				.setProtectedHeader({ alg: jwksAlg, kid: privateKeyData.kid })
				.setIssuedAt()
				.setExpirationTime(
					Math.round((Date.now() + expirationTime) / 1000),
				)
				.setAudience(aud)
				.setIssuer(signOptions.issuer)
				.sign(privateKeyData.key)

			return token
		},
	)

	fastify.decorate('jwksStores', {})

	fastify.decorate('verifyRsaToken', async <T>(token: string): Promise<T> => {
		if (verifyOptions == null) {
			throw new Error('Verify options are not provided')
		}
		const { iss } = jose.decodeJwt(token)

		if (iss == null) {
			throw new Error('Token does not contain issuer')
		}

		let jwksStore = fastify.jwksStores[iss]

		if (jwksStore == null) {
			if (
				verifyOptions.authorizedIssuers == null ||
				!verifyOptions.authorizedIssuers.includes(iss)
			) {
				throw new Error(`Unauthorized issuer: ${iss}`)
			}
			jwksStore = jose.createRemoteJWKSet(
				new URL(`${iss}/.well-known/jwks.json`),
			)
			fastify.jwksStores[iss] = jwksStore
		}

		const { payload } = await jose.jwtVerify(token, jwksStore, {
			audience: verifyOptions.selfAudience,
		})
		return payload as T
	})
}

export default fp(jwksPlugin)
