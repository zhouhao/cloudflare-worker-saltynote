export const saveRefreshToken = async (token, user, env) => {
  const { success } = await env.DATABASE.prepare(`
    insert into refresh_token (token, user_id, created_at, expire_at) values (?, ?, ?, ?)
  `).bind(token, user.id, Date.now(), Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90).run();
  return success;
};


export const fetchOrCreateUserByEmail = async (email, env) => {
  let result = await env.DATABASE.prepare(`select * from user where email = ?`).bind(email).first();

  if (!result) {
    // create new user
    const { success } = await env.DATABASE.prepare(`insert into user (email, username, created_at) values (?, ?, ?)`)
      .bind(email, 'saltynote', Date.now()).run();

    if (success) {
      result = await env.DATABASE.prepare(`select * from user where email = ?`).bind(email).first();
    }
  }
  return result;
};
