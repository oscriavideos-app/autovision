import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { imageUrl } = body;

    // Trocamos para o motor Luma Dream Machine focando no giro 360 mais rápido
    const { request_id } = await fal.queue.submit("fal-ai/luma-dream-machine", {
      input: {
        prompt: "Smooth 360-degree camera orbit completely around the car, fast pan showcasing all sides, photorealistic, maintain original car geometry and colors perfectly.",
        image_url: imageUrl,
        loop: true
      }
    });

    // Retorna o ID na hora para o navegador
    return NextResponse.json({ success: true, requestId: request_id });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao iniciar a geração do vídeo no Luma.' }, { status: 500 });
  }
}