const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getDropboxClient,
  buildAuthUrl,
  exchangeCodeForToken,
  TOKENS_PATH,
  ensureTokens
} = require('./dropbox');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper to wrap async route handlers
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.get('/auth/url', (req, res) => {
  const url = buildAuthUrl(process.env);
  console.log(`[AUTH] URL gerada: ${url}`);
  res.json({ url });
});

router.get('/auth/callback', asyncHandler(async (req, res) => {
  const { code, error, error_description } = req.query;
  if (error) {
    console.error('[AUTH] Erro no callback:', error, error_description);
    return res.status(400).send(`<h1>Erro de autenticação</h1><p>${error}: ${error_description || ''}</p>`);
  }
  if (!code) return res.status(400).send('Parâmetro code ausente');

  const tokens = await exchangeCodeForToken(process.env, code);
  console.log('[AUTH] Tokens salvos em', TOKENS_PATH);

  // Página minimalista que notifica a janela de origem e fecha.
  return res.status(200).send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Login Dropbox</title></head>
<body style="font-family: sans-serif;">
<h2>Autenticação concluída ✅</h2>
<p>Você já pode voltar ao aplicativo.</p>
<script>
  try {
    if (window.opener) {
      window.opener.postMessage({ type: 'dropbox-auth-success' }, '*');
    }
  } catch (e) {}
  setTimeout(() => { window.close(); }, 500);
</script>
</body></html>`);
}));

router.get('/files', asyncHandler(async (req, res) => {
  const { dbx } = await getDropboxClient(process.env);

  const items = [];
  let resp = await dbx.filesListFolder({ path: '' });
  items.push(...(resp.result.entries || []));
  while (resp.result.has_more) {
    resp = await dbx.filesListFolderContinue({ cursor: resp.result.cursor });
    items.push(...(resp.result.entries || []));
  }

  const mapped = items
    .filter(i => i['.tag'] === 'file' || i['.tag'] === 'folder')
    .map(i => ({
      tag: i['.tag'],
      name: i.name,
      id: i.id,
      path_lower: i.path_lower,
      client_modified: i.client_modified || null,
      server_modified: i.server_modified || null,
      size: i.size || 0
    }));

  res.json({ files: mapped });
}));

router.post('/upload', upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo não enviado (campo "file")' });
  const { dbx } = await getDropboxClient(process.env);
  const dropboxPath = path.posix.join('/', req.file.originalname);

  console.log(`[UPLOAD] Recebido ${req.file.originalname} (${req.file.size} bytes)`);

  const resp = await dbx.filesUpload({
    path: dropboxPath,
    contents: req.file.buffer,
    mode: { '.tag': 'add' },
    autorename: true,
    mute: false,
    strict_conflict: false
  });

  res.status(201).json({ entry: resp.result });
}));

// Express não lida bem com :path contendo '/'; use wildcard
router.get('/download/*', asyncHandler(async (req, res) => {
  const rawPath = req.params[0];
  if (!rawPath) return res.status(400).json({ error: 'Path ausente' });
  const pathParam = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
  const { dbx } = await getDropboxClient(process.env);

  console.log(`[DOWNLOAD] ${pathParam}`);

  const resp = await dbx.filesDownload({ path: pathParam });
  const fileName = resp.result.name || pathParam.split('/').pop();
  const fileBinary = resp.result.fileBinary;

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  return res.send(Buffer.from(fileBinary));
}));

router.delete('/delete/*', asyncHandler(async (req, res) => {
  const rawPath = req.params[0];
  if (!rawPath) return res.status(400).json({ error: 'Path ausente' });
  const pathParam = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
  const { dbx } = await getDropboxClient(process.env);

  console.log(`[DELETE] ${pathParam}`);

  const resp = await dbx.filesDeleteV2({ path: pathParam });
  res.json({ deleted: resp.result.metadata });
}));

router.get('/auth/status', asyncHandler(async (req, res) => {
  try {
    await ensureTokens(process.env);
    res.json({ authenticated: true });
  } catch (e) {
    res.json({ authenticated: false });
  }
}));

// Gera link temporário para visualização/preview (não expõe access_token)
router.get('/preview', asyncHandler(async (req, res) => {
  const { path: queryPath } = req.query;
  if (!queryPath || typeof queryPath !== 'string') {
    return res.status(400).json({ error: 'Parâmetro query "path" é obrigatório' });
  }
  const pathParam = queryPath.startsWith('/') ? queryPath : '/' + queryPath;
  const { dbx } = await getDropboxClient(process.env);

  console.log(`[PREVIEW] ${pathParam}`);

  const result = await dbx.filesGetTemporaryLink({ path: pathParam });
  const url = result?.result?.link;
  if (!url) {
    return res.status(500).json({ error: 'Falha ao gerar temporary link' });
  }
  res.json({ url });
}));

// Stream inline para PDF/imagem usando temporary link (evita bug res.buffer)
router.get('/preview/inline', asyncHandler(async (req, res) => {
  const { path: queryPath } = req.query;
  if (!queryPath || typeof queryPath !== 'string') {
    return res.status(400).json({ error: 'Parâmetro query "path" é obrigatório' });
  }
  const pathParam = queryPath.startsWith('/') ? queryPath : '/' + queryPath;
  const { dbx } = await getDropboxClient(process.env);
  console.log(`[PREVIEW_INLINE] ${pathParam}`);

  // Primeiro gera temporary link
  const tmp = await dbx.filesGetTemporaryLink({ path: pathParam });
  const fileName = tmp.result?.metadata?.name || pathParam.split('/').pop();
  const link = tmp.result?.link;
  if (!link) return res.status(500).json({ error: 'Falha ao gerar temporary link' });

  // Faz download via axios para controlar headers
  const axios = require('axios');
  const fileResp = await axios.get(link, { responseType: 'arraybuffer' });
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mimeMap = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    txt: 'text/plain; charset=utf-8'
  };
  const contentType = mimeMap[ext] || fileResp.headers['content-type'] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', fileResp.data.length);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
  return res.send(Buffer.from(fileResp.data));
}));

module.exports = router;
