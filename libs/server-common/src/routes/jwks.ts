import { FastifyPluginAsync } from 'fastify'
import { KeyStore, publicKeysRedisKey } from '../plugins/jwks'

const jwksRoutes: FastifyPluginAsync = async (fastify) => {
	fastify.get('/.well-known/jwks.json', async (request, reply) => {
		const currentKeys = JSON.parse(
			(await fastify.jwksRedis.get(publicKeysRedisKey)) || '{"keys": []}',
		) as KeyStore

		reply.status(200).send({
			keys: currentKeys.keys.map((key) => ({
				kid: key.kid,
				...key.key,
			})),
		})
	})
}

export default jwksRoutes
