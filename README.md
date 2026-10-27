# 🍔 Iago Lanches 2 — Painel de Entregas Facity, Google Maps & Maquininha de Bip (Pelotas - RS)

Sistema de gestão de entregas em tempo real para a **Iago Lanches 2** (**Av. Fernando Osório, 2870 — Três Vendas, Pelotas/RS**), integrado ao **Facity** (`apiv2.facity.com.br`), **iFood (via Facity)**, **Google Maps** e **Maquininha Leitora de Código de Barras (HID)** com disparo automático para o **WhatsApp** dos motoboys.

---

## ✨ Recursos Principais

- **Integração Facity & iFood:** Sincroniza pedidos do Facity (incluindo pedidos `origin: "ifood"`, `"app"` e `"pos"`), exibindo fielmente o valor total calculado pelo Facity.
- **Semáforo de Tempo de Espera:**
  - 🟢 **Verde (`< 15 min`):** Recém pediu
  - 🟠 **Laranja (`15 a 30 min`):** Mais de 15 minutos
  - 🟠 **Laranja Intenso (`30 a 45 min`):** Mais de 30 minutos
  - 🔴 **Vermelho Piscante (`> 45 min`):** Crítico (mais de 45 minutos)
- **Mapa de Pelotas Fiel ao Google Maps (Modo Limpo):** Renderiza todas as ruas e avenidas de Pelotas sem poluição visual de pontos comerciais, exibindo as rotas reais rua-a-rua e a localização dos motoboys.
- **Rastreio e Escala Diária dos 7 Motoboys (`Junior`, `Adrian`, `Naldo`, `David`, `Alvaro`, `Diego`, `Christofer`):**
  - Barra superior indicando em tempo real onde cada motoboy está (`Na Loja` ou em rota com o número da comanda e rua).
  - Opção de **Ativar / Desativar (`🟢 Ativo Hoje` / `⚫ De Folga`)** os motoboys nos dias com equipe reduzida.
- **Central da Maquininha de Bip & WhatsApp:**
  - Seleção rápida do motoboy (`F1`–`F7` ou clique direto) + leitura do código de barras da comanda (ou digitação do número) com envio imediato da rota do Google Maps para o WhatsApp do entregador.
  - Botão **`✓ Entregue`** ao lado do nome do cliente para concluir a tele-entrega e retornar o motoboy para a base.

---

## 🚀 Como Executar Localmente (Windows)

Dê dois cliques em `Iniciar_Iago_Lanches_2.bat` ou execute no terminal:

```bash
pip install -r requirements.txt
uvicorn src.main:app --host 0.0.0.0 --port 8000
```

Acesse: `http://localhost:8000`

---

## ☁️ Como Publicar na Nuvem (Render.com / Docker)

O repositório já inclui `Dockerfile` e `render.yaml`:
1. Suba este repositório no **GitHub**.
2. No [Render.com](https://render.com), clique em **New + ➔ Web Service** e conecte este repositório.
3. Configure as variáveis de ambiente (`FACITY_USERNAME`, `FACITY_PASSWORD`, `FACITY_COMPANY`) conforme o arquivo `.env.example`.
