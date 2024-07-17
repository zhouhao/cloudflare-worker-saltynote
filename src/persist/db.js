export const saveRefreshToken = async (token, userId, env) => {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = nowInSeconds + parseInt(env.JWT_REFRESH_TOKEN_TTL_SEC);
  const { success } = await env.DATABASE.prepare(`
    insert into refresh_token (token, user_id, created_at, expire_at) values (?, ?, ?, ?)
  `).bind(token, userId, nowInSeconds, expiresInSeconds).run();
  return success;
};

export const getLatestRefreshTokenByUserId = async (userId, env) => {
  return await env.DATABASE.prepare(`SELECT * from refresh_token where user_id = ? order by id desc limit 1`)
    .bind(userId).first();
};

export const getRefreshToken = async (userId, token, env) => {
  return await env.DATABASE.prepare(`SELECT * from refresh_token where user_id = ? and token = ?`).bind(userId, token).first();
};

export const deleteRefreshTokenByUserId = async (userId, env) => {
  const { success } = await env.DATABASE.prepare(`delete from refresh_token where user_id = ?`).bind(userId).run();
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


// ---- Page Annotation Query ----
const fixTags = result => {
  result.tags = JSON.parse(result.tags);
  return result;
};
export const getAnnotationById = async (id, userId, env) => {
  let result = await env.DATABASE.prepare(`select * from page_annotation where id = ? and user_id = ?`).bind(id, userId).first();
  return fixTags(result);
};

export const getAnnotationsByUserId = async (userId, env) => {
  const { results } = await env.DATABASE.prepare(`select * from page_annotation where user_id = ?`).bind(userId).all();
  results.forEach((annotation) => {
    fixTags(annotation);
  });
  return results;
};

export const getAnnotationsByUserIdAndUrl = async (userId, url, env) => {
  const { results } = await env.DATABASE.prepare(`select * from page_annotation where user_id = ? and url = ?`).bind(userId, url).all();
  results.forEach((annotation) => {
    fixTags(annotation);
  });
  return results;
};


// TODO: check the effected row count
export const deleteAnnotationById = async (id, userId, env) => {
  const { success } = await env.DATABASE.prepare(`delete from page_annotation where id = ? and user_id = ?`).bind(id, userId).run();
  return success;
};

export const updateAnnotationById = async (id, userId, annotation, env) => {
  const originalAnnotation = await getAnnotationById(id, userId, env);
  if (!originalAnnotation) {
    return {};
  }

  const highlightColor = annotation.highlight_color || originalAnnotation.highlight_color;
  const selectedText = annotation.selected_text || originalAnnotation.selected_text;
  const note = annotation.note || originalAnnotation.note;
  const url = annotation.url || originalAnnotation.url;
  const tags = annotation.tags || originalAnnotation.tags;

  const { success } = await env.DATABASE.prepare(`update page_annotation set
    highlight_color = ?,
    selected_text = ?,
    note = ?,
    url = ?,
    tags = ?
  where id = ? and user_id = ?`).bind(highlightColor, selectedText, note, url, tags, id, userId).run();

  return success ? await getAnnotationById(id, userId, env) : {};
};

export const createAnnotation = async (userId, annotation, env) => {
  const highlightColor = annotation.highlight_color || '#ffff00';
  const selectedText = annotation.selected_text;
  const note = annotation.note;
  const url = annotation.url;
  const tags = annotation.tags ? JSON.stringify(annotation.tags) : '[]';
  const isPageOnly = annotation.is_page_only || false;

  const {
    success,
    meta
  } = await env.DATABASE.prepare(`insert into page_annotation (user_id, highlight_color, selected_text, note, url, tags, is_page_only, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(userId, highlightColor, selectedText, note, url, tags, isPageOnly, Date.now()).run();

  if (success) {
    const id = meta.last_row_id;
    return await getAnnotationById(id, userId, env);
  }
  return null;
};
