import FastifyEdge from 'fastify-edge';

const app = FastifyEdge();

app.get('/', (_, reply) => {
	reply.send({ 'Hello': 'World' });
});
