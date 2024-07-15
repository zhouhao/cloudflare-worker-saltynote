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


// ---- Page Annotation Query ----

export const getAnnotationById = async (id, user_id, env) => {
  return await env.DATABASE.prepare(`select * from page_annotation where id = ? and user_id = ?`).bind(id, user_id).first();
};


export const deleteAnnotationById = async (id, user_id, env) => {
  const { success } = await env.DATABASE.prepare(`delete from page_annotation where id = ? and user_id = ?`).bind(id, user_id).run();
  return success;
};

export const updateAnnotationById = async (id, user_id, annotation, env) => {
  const originalAnnotation = await getAnnotationById(id, user_id, env);
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
  where id = ? and user_id = ?`).bind(highlightColor, selectedText, note, url, tags, id, user_id).run();

  return success ? await getAnnotationById(id, user_id, env) : {};
};

export const createAnnotation = async (user_id, annotation, env) => {
  const highlightColor = annotation.highlight_color || '#ffff00';
  const selectedText = annotation.selected_text;
  const note = annotation.note;
  const url = annotation.url;
  const tags = annotation.tags || '[]';
  const isPageOnly = annotation.is_page_only || false;

  const {
    success,
    meta
  } = await env.DATABASE.prepare(`insert into page_annotation (user_id, highlight_color, selected_text, note, url, tags, is_page_only, created_at) values (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(user_id, highlightColor, selectedText, note, url, tags, isPageOnly, Date.now()).run();

  if (success) {
    const id = meta.last_row_id;
    return await getAnnotationById(id, user_id, env);
  }
  return null;
};
