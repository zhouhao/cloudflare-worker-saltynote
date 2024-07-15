import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { sendEmail } from './handler/email';
import { generateCode, generateTokenPair } from './utils/base';
import { kvGet, saveEmailVerifyCode } from './persist/kv-store';
import { fetchOrCreateUserByEmail, saveRefreshToken } from './persist/db';
import isEmail from 'validator/es/lib/isEmail';

const app = new Hono();

// ---- User API ----

// 1. send email verify code
app.post('/email', async c => {
  const { email } = await c.req.json();
  if (!isEmail(email)) {
    return c.json({ 'error': `Invalid email` }, 400);
  }
  const verifyCode = generateCode(8);
  await saveEmailVerifyCode(c.env.KV, email, verifyCode);
  await sendEmail(email, verifyCode, c.env.RESEND_API_KEY);
  return c.json({ 'message': 'Email verification code has been sent.' });
});

// 2. login with email verify code

app.post('/login', async c => {
  const { email, token } = await c.req.json();
  if (isEmail(email) && await kvGet(c.env.KV, email) === token) {
    const user = await fetchOrCreateUserByEmail(email, c.env);
    const tokenPair = await generateTokenPair(user, c.env);
    await saveRefreshToken(tokenPair.refresh_token, user, c.env);
    return c.json(tokenPair);
  } else {
    return c.json({ 'error': `Invalid email or verification code` }, 400);
  }
});


// ---- Page Annotation API ----


app.get('/', async c => {
  return c.json({ 'message': `hello world` });
});

app.use('/v1/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_ACCESS_SECRET
  });
  return jwtMiddleware(c, next);
});

app.get('/v1/auth/page', (c) => {
  const payload = c.get('jwtPayload');
  return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});


app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ 'error': `${err.message}` }, err.status);
});

export default app;
