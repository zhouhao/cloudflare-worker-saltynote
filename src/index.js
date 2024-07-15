import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { sendEmail } from './handler/email';
import { generateCode, generateTokenPair, getUserId, handleNull } from './utils/base';
import { kvGet, saveEmailVerifyCode } from './persist/kv-store';
import {
  createAnnotation,
  deleteAnnotationById,
  fetchOrCreateUserByEmail,
  getAnnotationById,
  saveRefreshToken,
  updateAnnotationById
} from './persist/db';
import isEmail from 'validator/es/lib/isEmail';

const app = new Hono();

app.get('/', async c => {
  return c.json({ 'message': `hello world` });
});

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


// ---- Page Annotation API, auth is needed ----
app.use('/v1/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_ACCESS_SECRET
  });
  return jwtMiddleware(c, next);
});

// 0. test whether auth info can be returned correctly
app.get('/v1/auth/page', (c) => {
  const payload = c.get('jwtPayload');
  return c.json(payload); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});

// 1. create new annotation
app.post('/v1/annotation', async (c) => {
  const annotation = await c.req.json();
  if (!annotation.url || (!annotation.selected_text && !annotation.note)) {
    return c.json({ 'error': `Invalid page annotation payload` }, 400);
  }
  const userId = getUserId(c);

  const pageAnnotation = await createAnnotation(userId, annotation, c.env);
  return c.json(pageAnnotation); // eg: { "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }
});


// 2. get annotation by id
app.get('/v1/annotation/:id', async (c) => {
  const id = c.req.param('id');
  const userId = getUserId(c);
  return c.json(handleNull(await getAnnotationById(id, userId, c.env)));
});

// 3. update annotation by id
app.put('/v1/annotation/:id', async (c) => {
  const id = c.req.param('id');
  const annotation = await c.req.json();
  const userId = getUserId(c);
  return c.json(handleNull(await updateAnnotationById(id, userId, annotation, c.env)));
});

// 4. delete annotation by id
app.delete('/v1/annotation/:id', async (c) => {
  const id = c.req.param('id');
  const userId = getUserId(c);
  const success = await deleteAnnotationById(id, userId, c.env);
  return c.json({ success: success });
});


// ---- Error Handling ----
app.onError((err, c) => {
  return c.json({ 'error': `${err.message}` }, err.status);
});

export default app;
