import { randomUUID } from 'crypto'
import fp from 'fastify-plugin'
import { FastifyPluginAsync } from 'fastify'
import Redis, { RedisOptions } from 'ioredis'
import { getLogger } from '../utils/logger'
import * as jose from 'jose'

declare module 'fastify' {
	interface FastifyInstance {
		verifyRsaToken<T>(token: string): Promise<T>
		signRsaToken<T extends jose.JWTPayload>(payload: T): Promise<string>
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

const jwksPlugin: FastifyPluginAsync<{
	redisOptions: RedisOptions
	privateKeyValidityTime: number
	authorizedIssuers?: string[]
	issuer: string
	redisPrefix: string
}> = async (fastify, options) => {
	const { redisOptions, privateKeyValidityTime, authorizedIssuers, issuer, redisPrefix } =
		options
	const publicKeyValidityTime = privateKeyValidityTime * 2
	const redis = new Redis(redisOptions)

	if (redis === null) {
		throw new Error('Redis connection failed')
	}
	
	fastify.decorate('getRedisKey', (key: string) => {
		return `${redisPrefix}:${key}`
	})

	fastify.decorate('jwksRedis', redis)

	async function generateKey() {
		const { publicKey, privateKey } = await jose.generateKeyPair(jwksAlg, {
			extractable: true,
		})

		const publicKeyJwt = await jose.exportJWK(publicKey)
		const privateKeyJwt = await jose.exportJWK(privateKey)

		const now = Date.now()
		const kid = randomUUID().toString()

		const currentKeys = JSON.parse(
			(await fastify.jwksRedis.get(fastify.getRedisKey(publicKeysRedisKey))) || '{"keys": []}',
		) as KeyStore

		currentKeys.keys.push({
			key: publicKeyJwt,
			validity: now + publicKeyValidityTime,
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
			publicKeyValidityTime / 1000,
		)

		await fastify.jwksRedis.set(
			fastify.getRedisKey(privateKeyRedisKey),
			JSON.stringify({
				key: privateKeyJwt,
				validity: now + privateKeyValidityTime,
				kid: kid,
			} as Key),
			'EX',
			privateKeyValidityTime / 1000,
		)
	}

	fastify.decorate(
		'signRsaToken',
		async <T extends jose.JWTPayload>(payload: T): Promise<string> => {
			const privateKeyData = JSON.parse(
				(await fastify.jwksRedis.get(fastify.getRedisKey(privateKeyRedisKey))) || '{}',
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
				return fastify.signRsaToken(payload)
			}
			const token = new jose.SignJWT(payload)
				.setProtectedHeader({ alg: jwksAlg, kid: privateKeyData.kid })
				.setIssuedAt()
				.setExpirationTime(
					Math.round((Date.now() + privateKeyValidityTime) / 1000),
				)
				.setIssuer(issuer)
				.sign(privateKeyData.key)

			return token
		},
	)

	fastify.decorate('jwksStores', {})

	fastify.decorate('verifyRsaToken', async <T>(token: string): Promise<T> => {
		const { iss } = jose.decodeJwt(token)

		if (iss == null) {
			throw new Error('Token does not contain issuer')
		}

		let jwksStore = fastify.jwksStores[iss]

		if (jwksStore == null) {
			if (authorizedIssuers == null || !authorizedIssuers.includes(iss)) {
				throw new Error(`Unauthorized issuer: ${iss}`)
			}
			jwksStore = jose.createRemoteJWKSet(
				new URL(`${iss}/.well-known/jwks.json`),
			)
			fastify.jwksStores[iss] = jwksStore
		}

		const { payload } = await jose.jwtVerify(token, jwksStore)
		return payload as T
	})
}

export default fp(jwksPlugin)
