import { FastifyPluginAsync } from "fastify";
import { getLogger } from "server-common";

const socketPlugin: FastifyPluginAsync = async (fastify) => {
	fastify.io.use((socket, next) => {
		next();
	});

	fastify.io.on("connection", (socket) => {
		getLogger().debug(`Socket connected: ${socket.id}`);

		socket.on("disconnect", () => {
			getLogger().debug(`Socket disconnected: ${socket.id}`);
		});
	});
}

export default socketPlugin;