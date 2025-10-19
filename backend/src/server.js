// ===================================================
// Backend Express para receber leads e enviar ao RD
// ===================================================

require("dotenv").config(); // Lê variáveis do .env
const express = require("express");
const cors = require("cors");
const path = require("path");

// Import fetch para CommonJS (Node 18+ tem fetch nativo, mas com require precisa desse workaround)
const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================
// Middlewares
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend
app.use(express.static(path.join(__dirname, "../../frontend/public")));

// ==========================
// Rota principal
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/public/index.html"));
});

// ==========================
// Rota para envio de leads
// ==========================
app.post("/lead", async (req, res) => {
  const { nome, email, mensagem } = req.body;

  if (!nome || !email) {
    return res.status(400).json({ error: "Nome e email são obrigatórios" });
  }
try {
  const response = await fetch(
    "https://api.rd.services/platform/conversions",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.RD_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event_type: "CONVERSION",
        event_family: "CDP",
        payload: {
          name: nome,
          email: email,
          cf_mensagem: mensagem || ""
        }
      })
    }
  );

  // Tenta ler JSON, mas se vazio, retorna objeto vazio
  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = {};
  }

  if (!response.ok) {
    console.error("Erro RD Station:", data);
    return res.status(response.status).json({ error: data });
  }

  console.log("Lead enviado para RD Station:", data);
  return res.json({ success: true, rdStation: data });

} catch (err) {
  console.error("Erro interno:", err);
  return res.status(500).json({ error: "Erro interno no servidor" });
}

});

// ==========================
// SPA fallback ou páginas desconhecidas
// ==========================
app.get(/^\/.*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/public/index.html"));
});

// ==========================
// Inicia o servidor
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
