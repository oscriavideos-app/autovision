import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const data = await req.formData();
    const audioFile = data.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'Nenhum áudio enviado.' }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });

    const rawText = transcription.text;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um assistente de limpeza de texto automotivo. O usuário enviou uma transcrição de áudio que pode conter ruídos ou conversas de fundo.
          Sua missão: Extrair APENAS o veículo (modelo/ano) e as modificações exatas solicitadas (externas ou internas).
          Ignore qualquer frase que não faça parte do pedido do carro.
          Retorne o texto limpo, direto e em português. Exemplo: "Celta 2011 preto, teto branco, farol azul neon, maçaneta dourada e rodas vermelhas."`
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      temperature: 0.1,
    });

    const cleanedText = completion.choices[0].message.content.trim();

    return NextResponse.json({ text: cleanedText });

  } catch (err) {
    console.error('[transcribe error]', err);
    return NextResponse.json({ error: 'Erro ao processar áudio.' }, { status: 500 });
  }
}