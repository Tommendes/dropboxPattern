# ✅ **PROMPT ATUALIZADO PARA O COPILOT (GPT-5)**

> **Copilot (usando o modelo GPT-5), crie para mim um projeto completo Node.js + Vue 3 que integre com Dropbox seguindo exatamente as especificações abaixo.**

Você agora é um **arquiteto fullstack sênior**, especialista em:

* OAuth2 com Dropbox,
* segurança,
* Node.js + Express,
* Vue3 + Vite,
* Pinia,
* integração frontend↔backend.

Responda com **código completamente funcional**, **estrutura de pastas**, **arquivos separados**, sem pseudocódigo, e explique brevemente onde necessário.

---

## **🎯 Objetivo**

Criar uma aplicação fullstack (Node.js + Vue3) com integração ao Dropbox para:

* autenticação OAuth2
* listar arquivos de uma pasta
* fazer upload de arquivos
* fazer download de arquivos
* excluir arquivos

---

## **📌 Back-end (Node.js)**

Use:

* Express
* Dropbox SDK oficial
* dotenv
* cors
* multer
* axios

Criar as rotas:

1. `GET /auth/url`

   * retorna URL de login no Dropbox

2. `GET /auth/callback?code=`

   * troca `code` por access_token
   * salva token em `tokens.json`

3. `GET /files`

   * lista arquivos da raiz do Dropbox

4. `POST /upload`

   * recebe upload via `multer`
   * publica no Dropbox

5. `GET /download/:path`

   * baixa um arquivo do Dropbox

6. `DELETE /delete/:path`

   * remove um arquivo

Salvar tokens em:

```
backend/src/tokens.json
```

Variáveis `.env` no backend:

```
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
DROPBOX_REDIRECT_URI=http://localhost:3000/auth/callback
PORT=3000
```

---

## **🏗️ Estrutura backend**

```
backend/
  src/
    app.js
    routes.js
    dropbox.js
    tokens.json
  .env
  package.json
```

Adicionar script `"start": "node src/app.js"`

---

## **🎨 Front-end (VueJS 3)**

Use:

* Vite
* Vue Router
* Pinia
* Axios
* Componente de upload

Rotas:

* `/` → lista arquivos
* `/upload` → formulário de upload

Componentes:

* `FileList.vue`
* `Upload.vue`

Store (`dropboxStore.js`) contendo:

* listFiles()
* uploadFile()
* downloadFile()
* deleteFile()
* login()

Variáveis `.env` frontend:

```
VITE_API_URL=http://localhost:3000
```

---

## **💅 UI**

* tabela com nome, modificação e tamanho
* botões (download / delete)
* loading
* botão “Login Dropbox”

Tailwind opcional.

---

## **📖 README.md**

Gerar:

* passo a passo para criar app no Dropbox Developers

  * [https://www.dropbox.com/developers/apps](https://www.dropbox.com/developers/apps)
* configurar OAuth2
* adicionar redirect
* como rodar backend
* como rodar frontend
* exemplos cURL

---

## **🧪 Testes**

Gerar seção de testes manuais no README:

* upload
* delete
* download
* refresh da listagem

---

## **⚠️ Importante:**

* Não gerar pseudocódigo
* Mostrar tudo arquivo a arquivo
* Código pronto para rodar

---

## **🔥 Extra**

Adicionar:

* middleware global de erro
* logs de operações no console

---

## **Entrega esperada**

O Copilot deve gerar:

✅ backend completo
✅ frontend completo
✅ README
✅ instruções de uso
✅ configuração OAuth funcional
✅ tokens persistentes

---

Agora gere **todos os arquivos completos** e explique como testar cada etapa.