require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(morgan('dev'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/', routes);

// Erro 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware global de erro
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const id = Date.now().toString(36);
  console.error(`[ERROR ${id}]`, err.stack || err);
  res.status(status).json({ error: err.message || 'Erro interno', id });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
});
