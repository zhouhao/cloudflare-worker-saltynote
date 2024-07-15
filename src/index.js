import { Hono } from 'hono';
import { sign, jwt } from 'hono/jwt';
import { sendEmail } from './handler/email';
import { generateCode } from './utils/base';
import { kvGet, saveEmailVerifyCode } from './persist/kv-store';


const app = new Hono();

// ---- User API ----

// 1. send email verify code
app.post('/email', async c => {
  const { email } = await c.req.json();
  const verifyCode = generateCode(8);
  await saveEmailVerifyCode(c.env.saltynote, email, verifyCode);
  await sendEmail(email, generateCode(8), c.env.RESEND_API_KEY);
  return c.json({ 'message': await kvGet(c.env.KV, 'hello') + 'Email verification code has been sent.' + await kvGet(c.env.KV, email) });
});

// 2. login with email verify code

app.post('/login', c => {

});


// ---- Page Annotation API ----


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
