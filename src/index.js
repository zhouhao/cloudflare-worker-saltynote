import { Hono } from 'hono';

const app = new Hono();

app.get('/', async c => {
  return c.json({ 'hello': 'world' });
});


export default app;
