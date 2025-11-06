# ✅ **PROMPT ADICIONAL PARA O COPILOT — VISUALIZAÇÃO DE ARQUIVOS DO DROPBOX NO NAVEGADOR**

> Copilot (GPT-5), quero que você adicione à minha aplicação existente (Node.js backend + Vue3 dashboard) a capacidade de visualizar arquivos do Dropbox diretamente no navegador. Não recrie o projeto; apenas adicione os recursos a seguir.

## ✅ **Alterações a implementar**

### 🔧 **Backend (Node.js / Express)**

Adicionar uma nova rota `GET /preview` com os requisitos:

* Recebe `path` (via query param)
* Usa `filesGetTemporaryLink` do Dropbox
* Retorna o link temporário JSON:

  ```json
  { "url": "<temporary_link>" }
  ```

Código desejado (ou equivalente):

```js
app.get("/preview", async (req, res) => {
  try {
    const { path } = req.query;
    const result = await dbx.filesGetTemporaryLink({ path });
    res.json({ url: result.result.link });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating preview link" });
  }
});
```

Essa rota **não** deve expor o `access_token`.

---

### 🧠 **Detecção de tipos de arquivo**

No frontend, diferenciar:

* `.pdf` → abrir diretamente no navegador
* `.doc / .docx / .xls / .xlsx / .ppt / .pptx` → abrir via Office Online Viewer:

  ```
  https://view.officeapps.live.com/op/view.aspx?src=<temporary_link>
  ```
* imagens (`.png, .jpg, .jpeg, .gif`) → abrir direto

---

### 🎨 **UI no Vue**

Nos componentes onde listamos arquivos:

* Adicionar coluna “Visualizar”
* Criar botão de preview `"👁️"`

Ao clicar:

* Chamar `/preview`
* Abrir em nova aba
* Usar `window.open(...)`

Exemplo:

```js
async function preview(path) {
  const { data } = await axios.get(`${API}/preview`, { params: { path } });
  const link = data.url;

  if (isOfficeFile(path)) {
    window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(link)}`, "_blank");
  } else {
    window.open(link, "_blank");
  }
}
```

Criar helper `isOfficeFile()`.

---

### 📄 **Opcional (Recomendado)**

Criar um componente Vue chamado `PreviewButton.vue`, com:

* ícone de olho
* loading state
* fallback friendly toast

---

### 🧪 **Testes manuais**

Adicionar ao README seção de testes:

* PDF abre no viewer do navegador
* DOCX e XLSX abrem no Office Online
* imagens abrem direto
* arquivos sem tipo conhecido baixam

---

### 🔒 Segurança

O Copilot deve **não**:

* expor token no frontend
* armazenar temporary_link permanentemente
* gerar refresh nesses endpoints

---

## ✅ **Entrega esperada**

O Copilot deve:

✅ adicionar rota `/preview` no backend
✅ adicionar botão “Visualizar” no dashboard Vue3
✅ detectar tipo de arquivo
✅ abrir com o Office Online quando necessário
✅ atualizar README com instruções

Não recrie o projeto — apenas incremente.