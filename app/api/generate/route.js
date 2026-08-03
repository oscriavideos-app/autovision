import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    // 1. Validação de Segurança da Chave
    if (!process.env.OPENAI_API_KEY) {
      console.error('[AutoVision ERRO]: Chave OPENAI_API_KEY ausente no ambiente.');
      return NextResponse.json(
        { error: 'Chave OPENAI_API_KEY não configurada no servidor.' }, 
        { status: 500 }
      );
    }

    // 2. Leitura do corpo da requisição enviada pelo frontend
    const body = await req.json().catch(() => ({}));
    const text = (body.text || '').trim();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Descrição do veículo vazia.' }, 
        { status: 400 }
      );
    }

    console.log('[AutoVision] Processando solicitação de imagem Premium para:', text);

    // 3. Chamada oficial à API da OpenAI com o modelo atualizado e prompt otimizado
    const response = await openai.images.generate({
      model: "gpt-image-2", 
      prompt: `Premium automotive studio photography of: ${text}. 
      CRITICAL SETTINGS: Photorealistic, ultra-detailed masterpiece. 
      LIGHTING & MATERIALS: High gloss paint with flawless clear coat, dramatic studio light reflections on the body, fenders, hood, and glass. 
      ENVIRONMENT: Clean studio background with a highly contrasting color to make the car pop and stand out. 
      RULES: 100% stock factory body shape. NO convertibles. NO tuning bodykits. Perfect, straight lines and decals without distortion.`,
      n: 1,
      size: "1024x1024"
    });

    // 4. Tratamento de compatibilidade (URL direta ou conversão de Base64)
    let imageUrl = response?.data?.[0]?.url;
    const base64Data = response?.data?.[0]?.b64_json;

    if (base64Data) {
      imageUrl = `data:image/png;base64,${base64Data}`;
    }

    if (!imageUrl) {
      console.error('[AutoVision ERRO]: A OpenAI respondeu, mas nenhum dado de imagem foi encontrado.');
      return NextResponse.json(
        { error: 'Nenhuma imagem retornada pela OpenAI.' }, 
        { status: 502 }
      );
    }

    console.log('[AutoVision SUCESSO]: Imagem gerada e convertida com sucesso.');

    // 5. Retorno bem-sucedido para o frontend
    return NextResponse.json(
      { images: [imageUrl] },
      { headers: { 'Cache-Control': 'no-store' } }
    );

  } catch (err) {
    console.error('[AutoVision ERRO CRÍTICO]:', err?.message || err);
    return NextResponse.json(
      { error: err?.message || 'Erro interno de comunicação com a OpenAI.' }, 
      { status: 500 }
    );
  }
}
