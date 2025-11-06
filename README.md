# Dropbox Fullstack (Node.js + Vue 3)

Aplicação fullstack com autenticação OAuth2 no Dropbox, listagem de arquivos, upload, download e exclusão.

## Estrutura

```
backend/
  src/
    app.js
    routes.js
    dropbox.js
    tokens.json
  .env
  package.json
frontend/
  src/
    main.js
    App.vue
    router/
      index.js
    store/
      dropboxStore.js
    components/
      FileList.vue
      Upload.vue
    pages/
      Home.vue
      UploadPage.vue
  index.html
  vite.config.js
  .env
```

## Pré-requisitos

- Node.js 16+
- Conta no Dropbox

## Passo a passo: criar app no Dropbox Developers

1. Acesse https://www.dropbox.com/developers/apps e clique em "Create app".
2. Escolha "Scoped access" e selecione o tipo de conta apropriado.
3. Dê um nome ao app.
4. Em "Permissions (Scopes)", habilite:
   - files.metadata.read
   - files.content.read
   - files.content.write
5. Em "OAuth 2", configure:
   - Redirect URIs: `http://localhost:3000/auth/callback`
   - Token access type: Offline (para obter refresh_token)
6. Copie o `App key` e o `App secret`.

## Configuração do backend

Crie e edite `backend/.env`:

```
DROPBOX_CLIENT_ID=SEU_APP_KEY
DROPBOX_CLIENT_SECRET=SEU_APP_SECRET
DROPBOX_REDIRECT_URI=http://localhost:3000/auth/callback
PORT=3000
```

Instale dependências e execute:

```bash
# Backend
cd backend
npm install

### Rotas do backend

- `GET /auth/url` → retorna URL para login no Dropbox
- `GET /auth/callback?code=...` → troca code por token, salva em `src/tokens.json`
- `POST /auth/logout` → limpa tokens locais (desconexão)
- `GET /files` → lista arquivos da raiz
- `POST /upload` → formulário multipart (campo `file`), publica no Dropbox
- `GET /download/*` → baixa arquivo (ex.: `/download//meuarquivo.txt`)
- `DELETE /delete/*` → remove arquivo (ex.: `/delete//meuarquivo.txt`)

Tokens persistem em `backend/src/tokens.json`.

## Configuração do frontend

Crie e edite `frontend/.env`:
         - Arraste um arquivo para a área tracejada ou clique em "escolha" e selecione.
         - Após upload, a lista se atualiza com o novo item.
```
VITE_API_URL=http://localhost:3000
```

Instale e rode:

```bash
# Frontend
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no navegador.
- Na página inicial, clique em "Login Dropbox".
- Uma janela popup abrirá a autorização do Dropbox.
- Ao concluir, a janela envia um `postMessage` ao app e fecha.

Autenticação: obtenha a URL do login

```bash
curl -s http://localhost:3000/auth/url
```

Listar arquivos

```bash
curl -s http://localhost:3000/files | jq
```

Upload de arquivo

```bash
curl -F "file=@/caminho/para/arquivo.txt" http://localhost:3000/upload
```

Download

```bash
curl -L "http://localhost:3000/download//arquivo.txt" -o arquivo.txt
```

Excluir

```bash
curl -X DELETE "http://localhost:3000/delete//arquivo.txt"
```

### Visualização (Preview)

Gerar link temporário para visualizar um arquivo (PDF, imagem, Office via viewer online):

Geração de link temporário bruto:

```bash
curl -G --data-urlencode "path=/arquivo.pdf" http://localhost:3000/preview
```

Página interna de preview (frontend): navegação para `/preview?path=<path>&name=<name>` abre:
- PDF: iframe
- Imagem: tag `<img>`
- TXT/CSV/MD: renderização de texto (CSV parseado em tabela, MD convertido em HTML)
- Office (docx/xlsx/pptx): abre viewer online Microsoft

Exemplo direto inline (forçando `Content-Disposition: inline`) para PDF/imagem/txt:
```bash
curl -G --data-urlencode "path=/arquivo.pdf" http://localhost:3000/preview/inline -o arquivo.pdf
```

## Testes manuais sugeridos

1. Login
   - Acesse a UI e clique em "Login Dropbox".
   - Permita o acesso e aguarde a janela fechar.
   - A badge "Autenticado" deve aparecer.
  - Clique em "Sair" para desconectar (tokens.json é limpo e precisa relogar depois).
2. Listar arquivos
   - Clique em "Atualizar" e verifique os itens.
3. Upload
   - Vá em "Upload", selecione um arquivo pequeno (até ~150 MB) e envie.
   - Volte à lista e atualize: o arquivo deve aparecer.
4. Download
   - Clique em "Download" ao lado de um arquivo e confirme o download do navegador.
5. Excluir
   - Clique em "Excluir" e confirme; atualize a lista e verifique a remoção.

6. Preview
  - PDF: botão "👁️" → rota interna `/preview` com iframe.
  - DOCX/XLSX/PPTX: abre em Office Online.
  - Imagens (PNG/JPG/GIF/WebP/SVG): exibidas inline.
  - TXT/CSV/MD: texto renderizado (CSV em tabela, MD convertido).
  - Outros: tentativa de abrir/download via link temporário.

### Segurança do preview

- O endpoint `/preview` não expõe `access_token`. Ele retorna apenas um `temporary_link` do Dropbox.
- O link é efêmero e não é persistido no backend ou frontend.
- O fluxo de refresh de token não é disparado por esta rota além do necessário para autenticação corrente.

## Observações

- Para arquivos muito grandes, utilize upload em blocos (chunked). Este exemplo usa `filesUpload`, adequado para arquivos menores.
- O token é atualizado automaticamente quando expira, usando `refresh_token` salvo em `tokens.json`.
- Há middleware global de erros no backend que retorna JSON com um `id` para referência.
