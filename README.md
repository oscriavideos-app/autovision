# 🚗 Auto Vision — AI Photo Studio

Descreva por voz o carro dos seus sonhos e a IA gera **4 renders em 360°** num
estúdio fotográfico com contraste dinâmico de luz. Interface Dark Futurista.

## Stack

- **Next.js 14** (App Router) + **TailwindCSS**
- **framer-motion** (animações, snap slider magnético, scan wireframe)
- **lucide-react** (ícones)
- **OpenAI** — Whisper (transcrição) + GPT-4o-mini (refino de prompt)
- **Fal.ai** — FLUX `schnell` (rápido) e `dev` (HD)

## Fluxo

1. Toque no botão de microfone pulsante e descreva o carro.
2. Whisper transcreve o áudio.
3. GPT-4o-mini transforma a fala num prompt fotográfico em inglês.
4. FLUX gera 4 ângulos (0° / 90° / 180° / 270°) em paralelo.
5. Use o **Snap Slider Magnético** para girar 360° e compartilhe via WhatsApp.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. As chaves ficam no arquivo `.env` (veja `.env.example`).

> ⚠️ A gravação de microfone exige contexto seguro: `localhost` ou HTTPS (Vercel).

## Variáveis de ambiente

| Variável         | Uso                                   |
| ---------------- | ------------------------------------- |
| `OPENAI_API_KEY` | Whisper + GPT-4o-mini                 |
| `FAL_KEY`        | Geração de imagens FLUX (schnell/dev) |

## Deploy na Vercel

```bash
npm i -g vercel      # se ainda não tiver a CLI
vercel login
vercel --prod
```

Durante o deploy, adicione `OPENAI_API_KEY` e `FAL_KEY` em
**Project Settings → Environment Variables** (ou via
`vercel env add OPENAI_API_KEY` / `vercel env add FAL_KEY`).
