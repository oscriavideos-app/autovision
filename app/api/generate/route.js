import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

export async function POST(req) {
  try {
    const body = await req.json();
    const { text } = body;
    
    if (!text) {
      return NextResponse.json({ error: 'Texto não fornecido' }, { status: 400 });
    }

    const t = text.toLowerCase();

    // 1. COR PRINCIPAL DA LATARIA (Garante que o capô e as portas sigam a cor certa)
    let corLataria = "glossy black";
    if (t.includes("branco") && !t.includes("teto branco")) corLataria = "glossy white";
    else if (t.includes("prata") || t.includes("cinza")) corLataria = "metallic silver";
    else if (t.includes("vermelho") && !t.includes("roda")) corLataria = "glossy red";
    else if (t.includes("azul")) corLataria = "metallic blue";

    // 2. ISOLAMENTO DO TETO
    let detalheTeto = `The top roof panel is painted in the same ${corLataria} color`;
    if (t.includes("teto branco")) {
      detalheTeto = "The top roof panel is distinctly painted in SOLID CRISP WHITE";
    } else if (t.includes("teto preto")) {
      detalheTeto = "The top roof panel is distinctly painted in SOLID GLOSSY BLACK";
    }

    // 3. ISOLAMENTO DAS RODAS
    let detalheRodas = "original factory OEM wheels";
    if (t.includes("vermelha") || t.includes("vermelhas")) {
      detalheRodas = "custom alloy wheels painted in BRIGHT RED";
    } else if (t.includes("preta") || t.includes("pretas")) {
      detalheRodas = "custom alloy wheels painted in GLOSSY BLACK";
    } else if (t.includes("bbs")) {
      detalheRodas = "BBS mesh alloy wheels";
    }

    // 4. SUSPENSÃO
    let suspensao = "standard factory suspension height";
    if (t.includes("slammed") || t.includes("rebaixado") || t.includes("socado") || t.includes("ar")) {
      suspensao = "slammed lowered suspension, low ground clearance";
    }

    // 5. LIMPAR O TEXTO PARA NÃO CONFUNDIR A IA
    // Removemos as cores e gírias para sobrar só o nome do carro (ex: "celta 2009")
    let carroNome = text.replace(/teto branco|teto preto|rodas vermelhas|roda vermelha|rodas pretas|roda preta|slammed|rebaixado|socado/gi, "").trim();
    if (!carroNome) carroNome = "car";

    // 6. ÂNGULO DE CÂMERA
    let anguloCamera = "front three-quarter view showing the front, hood, and side profile";
    if (t.includes("traseira") || t.includes("aerofólio") || t.includes("lanterna")) {
      anguloCamera = "rear three-quarter view showing the taillights, trunk, and side profile";
    }

    // 7. O PROMPT DE FERRO (Isolamento total de peças)
    const promptFlux = `Ultra-realistic 8k automotive studio photography of an authentic ${carroNome}.
    
    CRITICAL COLOR ASSIGNMENTS (DO NOT BLEED COLORS):
    - Main Body, Doors, FRONT HOOD, and Side Mirrors: These parts are strictly ${corLataria}. (The front hood MUST match the body).
    - Roof: ${detalheTeto}.
    - Wheels: ${detalheRodas}.
    - Front Grille & Badges: Original factory black plastic grille and standard chrome brand emblem. NO red color on the grille.
    
    MODIFICATIONS: ${suspensao}.
    
    ENVIRONMENT: Professional automotive studio with a SOLID NEUTRAL MEDIUM GREY background and polished concrete floor. High contrast, sharp focus, cinematic studio lighting, photorealistic.`;

    // 8. MOTOR FLUX (Ajustado para máxima nitidez)
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: promptFlux,
        image_size: "landscape_16_9",
        num_inference_steps: 35, // Passos altos para remover qualquer embaçado
        guidance_scale: 3.5
      },
      logs: true,
    });

    return NextResponse.json({ images: [result.data.images[0].url] });

  } catch (error) {
    console.error("Erro na rota de geração:", error);
    return NextResponse.json({ error: 'Erro ao gerar imagem' }, { status: 500 });
  }
}
