import { Hono } from 'hono';
import { sign, jwt } from 'hono/jwt';


const app = new Hono();

const secret = 'it-is-very-secret';

app.get('/', async c => {

  const payload = {
    sub: 'user123',
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 60 * 5 // Token expires in 5 minutes
  };
  const token = await sign(payload, secret);
  return c.json({ 'hello': token });
});


app.use(
  '/auth/*',
  jwt({
    secret: secret
  })
);

app.get('/auth/page', (c) => {
  const payload = c.get('jwtPayload');
  return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});


app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ 'error': `${err.message}` }, err.status);
});

export default app;
