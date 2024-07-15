import { sign } from 'hono/jwt';

// balance the numbers and the letters
const characters = '0123456789ABCDEFGHIJKLMN0123456789OPQRSTUVWXYZ0123456789';

export const generateCode = (length) => {
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};

export const generateTokenPair = async (user, env) => {
  return {
    'access_token': await sign({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // Token expires in 1 hour
    }, env.JWT_ACCESS_SECRET),
    'refresh_token': await sign({
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90 // Token expires in 90 days
    }, env.JWT_REFRESH_SECRET)
  };
};
