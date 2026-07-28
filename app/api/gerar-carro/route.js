import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

export const runtime = 'nodejs';
export const maxDuration = 300; // Tempo máximo estendido para aguardar o vídeo (5 minutos)
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    // Trocamos 'queue.submit' por 'subscribe' para ele esperar e pegar o vídeo real
    fal.config({ credentials: process.env.FAL_KEY });
    const result = await fal.subscribe("fal-ai/luma-dream-machine", {
      input: {
        prompt: "Smooth 360-degree camera orbit completely around the car, fast pan showcasing all sides, photorealistic, maintain original car geometry and colors perfectly.",
        image_url: imageUrl,
        loop: true
      },
      logs: true // Permite ver o andamento nos logs da Vercel
    });

    // Agora ele retorna a URL do vídeo pronto, e não apenas uma senha
    const videoUrl = result?.data?.video?.url || result?.video?.url;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falha ao recuperar o vídeo.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, videoUrl: videoUrl });

  } catch (error) {
    console.error('[Video Error]:', error);
    return NextResponse.json({ error: 'Erro ao gerar vídeo no Luma.' }, { status: 500 });
  }
                               }
