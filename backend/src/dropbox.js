const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');

// Polyfill fetch for Dropbox SDK in Node < 18
if (!global.fetch) {
  global.fetch = fetch;
}

const TOKENS_PATH = path.resolve(__dirname, 'tokens.json');

function loadTokens() {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, 'utf8');
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.access_token) return null;
    return data;
  } catch (err) {
    return null;
  }
}

function saveTokens(tokens) {
  const payload = JSON.stringify(tokens, null, 2);
  fs.writeFileSync(TOKENS_PATH, payload, 'utf8');
}

function hasValidAccessToken(tokens) {
  if (!tokens || !tokens.access_token) return false;
  if (!tokens.expires_at) return true; // no expiry info, assume valid
  return Date.now() < tokens.expires_at - 10_000; // 10s skew
}

async function refreshAccessToken(env, tokens) {
  if (!tokens || !tokens.refresh_token) {
    throw new Error('Refresh token ausente. Refaça o login.');
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', tokens.refresh_token);
  params.append('client_id', env.DROPBOX_CLIENT_ID);
  params.append('client_secret', env.DROPBOX_CLIENT_SECRET);

  const resp = await axios.post('https://api.dropboxapi.com/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const { access_token, expires_in, token_type, scope, account_id, uid } = resp.data;
  const updated = {
    ...tokens,
    access_token,
    token_type: token_type || tokens.token_type,
    scope: scope || tokens.scope,
    account_id: account_id || tokens.account_id,
    uid: uid || tokens.uid,
    expires_at: expires_in ? Date.now() + expires_in * 1000 : undefined
  };
  saveTokens(updated);
  return updated;
}

async function ensureTokens(env) {
  let tokens = loadTokens();
  if (!tokens) {
    throw Object.assign(new Error('Não autenticado. Realize login em /auth/url.'), { status: 401 });
  }
  if (!hasValidAccessToken(tokens)) {
    tokens = await refreshAccessToken(env, tokens);
  }
  return tokens;
}

async function getDropboxClient(env) {
  const tokens = await ensureTokens(env);
  const dbx = new Dropbox({ accessToken: tokens.access_token, fetch: global.fetch });
  return { dbx, tokens };
}

function buildAuthUrl(env) {
  if (!env.DROPBOX_CLIENT_ID) {
    const e = new Error('Variável de ambiente DROPBOX_CLIENT_ID ausente. Configure backend/.env e reinicie o servidor.');
    e.status = 500;
    throw e;
  }
  if (!env.DROPBOX_REDIRECT_URI) {
    const e = new Error('Variável de ambiente DROPBOX_REDIRECT_URI ausente. Configure backend/.env e reinicie o servidor.');
    e.status = 500;
    throw e;
  }
  const base = 'https://www.dropbox.com/oauth2/authorize';
  const params = new URLSearchParams({
    client_id: env.DROPBOX_CLIENT_ID,
    redirect_uri: env.DROPBOX_REDIRECT_URI,
    response_type: 'code',
    token_access_type: 'offline',
    force_reapprove: 'false',
    scope: 'files.metadata.read files.content.read files.content.write'
  });
  return `${base}?${params.toString()}`;
}

async function exchangeCodeForToken(env, code) {
  if (!env.DROPBOX_CLIENT_ID || !env.DROPBOX_CLIENT_SECRET || !env.DROPBOX_REDIRECT_URI) {
    const e = new Error('Variáveis de ambiente do Dropbox ausentes. Verifique DROPBOX_CLIENT_ID, DROPBOX_CLIENT_SECRET e DROPBOX_REDIRECT_URI.');
    e.status = 500;
    throw e;
  }
  const params = new URLSearchParams();
  params.append('code', code);
  params.append('grant_type', 'authorization_code');
  params.append('client_id', env.DROPBOX_CLIENT_ID);
  params.append('client_secret', env.DROPBOX_CLIENT_SECRET);
  params.append('redirect_uri', env.DROPBOX_REDIRECT_URI);

  const resp = await axios.post('https://api.dropboxapi.com/oauth2/token', params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  const { access_token, refresh_token, token_type, scope, account_id, uid, expires_in } = resp.data;
  const tokens = {
    access_token,
    refresh_token,
    token_type,
    scope,
    account_id,
    uid,
    expires_at: expires_in ? Date.now() + expires_in * 1000 : undefined
  };
  saveTokens(tokens);
  return tokens;
}

module.exports = {
  loadTokens,
  saveTokens,
  hasValidAccessToken,
  refreshAccessToken,
  ensureTokens,
  getDropboxClient,
  buildAuthUrl,
  exchangeCodeForToken,
  TOKENS_PATH
};
