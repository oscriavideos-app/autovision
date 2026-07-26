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

    // 1. IDENTIFICAÇÃO DA COR PRINCIPAL DA LATARIA
    let corCorpo = "glossy jet black";
    if (t.includes("branco") && !t.includes("teto branco")) corCorpo = "glossy white";
    else if (t.includes("prata")) corCorpo = "metallic silver";
    else if (t.includes("vermelho") && !t.includes("rodas vermelhas")) corCorpo = "glossy red";
    else if (t.includes("cinza")) corCorpo = "metallic grey";
    else if (t.includes("azul")) corCorpo = "glossy blue";

    // 2. DETECTOR DE TETO BICOLOR
    let detalheTeto = `roof panel painted in ${corCorpo}`;
    if (t.includes("teto branco")) {
      detalheTeto = "top roof panel painted in solid crisp white";
    } else if (t.includes("teto preto")) {
      detalheTeto = "top roof panel painted in solid glossy black";
    } else if (t.includes("carbono")) {
      detalheTeto = "top roof panel in real carbon fiber finish";
    }

    // 3. ISOLAMENTO DE CORES DAS RODAS
    let corRoda = "";
    if (t.includes("vermelha") || t.includes("vermelhas")) corRoda = "bright red";
    else if (t.includes("preta") || t.includes("pretas")) corRoda = "glossy black";
    else if (t.includes("dourada") || t.includes("douradas")) corRoda = "metallic gold";
    else if (t.includes("prata") || t.includes("cromada")) corRoda = "silver chrome";

    let detalheRodas = "custom alloy wheels";
    if (t.includes("bbs")) {
      detalheRodas = corRoda ? `${corRoda} BBS mesh alloy wheels` : "BBS mesh alloy wheels";
    } else if (t.includes("te37") || t.includes("volk")) {
      detalheRodas = corRoda ? `${corRoda} Volk TE37 alloy wheels` : "Volk TE37 alloy wheels";
    } else if (t.includes("stock") || t.includes("original") || t.includes("originais")) {
      detalheRodas = "factory stock OEM silver wheels";
    } else if (corRoda) {
      detalheRodas = `${corRoda} alloy wheel rims`;
    }

    // 4. SUSPENSÃO E POSTURA
    let postura = "factory stock suspension height";
    if (t.includes("slammed") || t.includes("slamad") || t.includes("rebaixado") || t.includes("socado") || t.includes("pregado") || t.includes("fixa") || t.includes("ar")) {
      postura = "slammed lowered suspension stance";
    }

    // 5. ÂNGULO DE CÂMERA
    let anguloCamera = "front three-quarter view showing front grille, hood, roof panel, and side wheels";
    if (t.includes("traseira") || t.includes("escapamento") || t.includes("lanterna") || t.includes("porta-mala") || t.includes("aerofólio")) {
      anguloCamera = "rear three-quarter view showing rear taillights, trunk, roof panel, and side wheels";
    }

    // 6. PROMPT ESTRUTURADO COM ISOLAMENTO DE PEÇAS E NITIDEZ
    const promptFlux = `Sharp 8k DSLR photo of an authentic 2009 Chevrolet Celta subcompact hatchback (Latin American Opel Corsa B hatchback body shape).

COLOR AND COMPONENT ASSIGNMENT:
- Main body, front hood, doors, and bumpers: ${corCorpo}.
- Roof: ${detalheTeto}.
- Wheel Rims: ${detalheRodas}.
- Stance: ${postura}.
- Side mirrors and door handles: factory stock black plastic.
- Headlights and grille: original clear glass headlights and standard Chevrolet emblem.

PHOTOGRAPHY SETTING:
- Angle: ${anguloCamera}.
- Studio: Professional automotive studio with a clean neutral light grey background and soft balanced illumination. High sharpness, razor-sharp focus, detailed textures, realistic vehicle paint.`;

    // Chamada no Fal.ai (Flux Dev)
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: promptFlux,
        image_size: "landscape_16_9",
        num_inference_steps: 32, // Mantido em 32 para máxima nitidez das linhas
        guidance_scale: 3.8     // Aumentado ligeiramente para forçar cumprimento estrito do prompt
      },
      logs: true,
    });

    return NextResponse.json({ images: [result.data.images[0].url] });

  } catch (error) {
    console.error("Erro na rota de geração:", error);
    return NextResponse.json({ error: 'Erro ao gerar imagem' }, { status: 500 });
  }
}
