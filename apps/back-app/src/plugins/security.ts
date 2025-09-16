import { FastifyInstance, FastifyPluginAsync, RouteOptions } from 'fastify'
import fp from 'fastify-plugin'

export function makeSecureMethod(
	fastify: FastifyInstance,
	method: 'get' | 'post' | 'put' | 'delete',
) {
	return (
		url: string,
		opts: Omit<RouteOptions, 'method' | 'url' | 'preHandler'> & {
			handler: RouteOptions['handler']
		},
	) => {
		fastify.route({
			method,
			url,
			...opts,
			preHandler: fastify.authenticate,
			handler: function (request, reply) {
				if (request.userId == null) {
					return reply.status(401).send({ error: 'Unauthorized' })
				}
				return opts.handler.call(this, request, reply)
			},
		})
	}
}

const securityPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.decorate('secureGet', makeSecureMethod(fastify, 'get'))
	fastify.decorate('securePost', makeSecureMethod(fastify, 'post'))
	fastify.decorate('securePut', makeSecureMethod(fastify, 'put'))
	fastify.decorate('secureDelete', makeSecureMethod(fastify, 'delete'))
}

declare module 'fastify' {
	interface FastifyInstance {
		secureGet: ReturnType<typeof makeSecureMethod>
		securePost: ReturnType<typeof makeSecureMethod>
		securePut: ReturnType<typeof makeSecureMethod>
		secureDelete: ReturnType<typeof makeSecureMethod>
	}
}

export default fp(securityPlugin)
