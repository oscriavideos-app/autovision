import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get('requestId');

  if (!requestId) {
    return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
  }

  try {
    // Busca o status agora no motor do Luma Dream Machine
    const status = await fal.queue.status("fal-ai/luma-dream-machine", {
      requestId: requestId,
      logs: true,
    });

    if (status.status === "COMPLETED") {
      const result = await fal.queue.result("fal-ai/luma-dream-machine", {
        requestId: requestId,
      });
      return NextResponse.json({ status: "COMPLETED", videoUrl: result.data.video.url });
    }

    return NextResponse.json({ status: status.status });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao verificar status.' }, { status: 500 });
  }
}