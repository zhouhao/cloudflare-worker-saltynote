import { sign, verify } from 'hono/jwt';

// balance the numbers and the letters
const characters = '0123456789ABCDEFGHIJKLMN0123456789OPQRSTUVWXYZ0123456789';

export const generateCode = (length) => {
  return Array.from({ length }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
};

export const generateTokenPair = async (userId, env, refreshToken = null) => {
  let rToken = '';
  if (refreshToken && await isRefreshTokenReusable(refreshToken, env)) {
    rToken = refreshToken;
  }
  return {
    'access_token': await sign({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 // Token expires in 1 hour
    }, env.JWT_ACCESS_SECRET),
    'refresh_token': rToken || await sign({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + env.JWT_REFRESH_TOKEN_TTL_SEC // so far 90 days
    }, env.JWT_REFRESH_SECRET)
  };
};


export const getUserId = context => {
  const payload = context.get('jwtPayload');
  return payload.sub;
};


export const handleNull = resp => {
  return resp || {};
};

export const isRefreshTokenReusable = async (token, env) => {
  if (!token) return false;
  try {
    const decodedPayload = await verify(token, env.JWT_REFRESH_SECRET);
    return decodedPayload.exp > Math.floor(Date.now() / 1000) + env.JWT_REFRESH_TOKEN_TTL_SEC / 2; // 45 days, half life
  } catch (e) {
    return false;
  }
};
