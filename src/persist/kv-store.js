export const kvGet = async (namespace, key) => {
  return await namespace.get(key);
};

export const kvSet = async (namespace, key, value, ttlInSecond) => {
  namespace.put(key, value, { expirationTtl: ttlInSecond });
};

export const saveEmailVerifyCode = async (namespace, email, verifyCode) => {
  await kvSet(namespace, email, verifyCode, 60 * 10);
};
