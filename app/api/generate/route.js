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

    // 1. COR PRINCIPAL DA LATARIA E CAPÔ
    let corCorpo = "black"; // padrão
    if (t.includes("branco") && !t.includes("teto branco")) corCorpo = "white";
    else if (t.includes("prata")) corCorpo = "silver";
    else if (t.includes("vermelho") && !t.includes("rodas vermelhas")) corCorpo = "red";
    else if (t.includes("cinza")) corCorpo = "grey";
    else if (t.includes("azul")) corCorpo = "blue";
    else if (t.includes("amarelo")) corCorpo = "yellow";

    // 2. DETECTOR DE TETO BICOLOR
    let detalheTeto = `same ${corCorpo} color as the body`;
    if (t.includes("teto branco")) {
      detalheTeto = "painted in solid crisp white finish (two-tone contrast)";
    } else if (t.includes("teto preto")) {
      detalheTeto = "painted in solid glossy black finish (two-tone contrast)";
    } else if (t.includes("carbono")) {
      detalheTeto = "made of real woven carbon fiber";
    }

    // 3. DETECTOR E COR DAS RODAS
    let corRoda = "";
    if (t.includes("vermelha") || t.includes("vermelhas")) corRoda = "red";
    else if (t.includes("preta") || t.includes("pretas")) corRoda = "black";
    else if (t.includes("dourada") || t.includes("douradas")) corRoda = "gold";
    else if (t.includes("prata") || t.includes("cromada")) corRoda = "silver chrome";

    let detalheRodas = "custom alloy wheels";
    if (t.includes("bbs")) {
      detalheRodas = corRoda ? `${corRoda} BBS mesh alloy wheels` : "BBS mesh alloy wheels";
    } else if (t.includes("te37") || t.includes("volk")) {
      detalheRodas = corRoda ? `${corRoda} Volk TE37 alloy wheels` : "Volk TE37 alloy wheels";
    } else if (t.includes("stock") || t.includes("original") || t.includes("originais")) {
      detalheRodas = "factory original OEM stock wheels";
    } else if (corRoda) {
      detalheRodas = `${corRoda} alloy wheels`;
    }

    // 4. SUSPENSÃO / POSTURA
    let postura = "standard factory suspension clearance";
    if (t.includes("slammed") || t.includes("slamad") || t.includes("rebaixado") || t.includes("socado") || t.includes("pregado") || t.includes("fixa") || t.includes("ar")) {
      postura = "slammed lowered suspension stance";
    }

    // 5. LIMPEZA DO MODELO (Extrai o nome do carro sem as gírias/cores)
    let modeloCarro = text
      .replace(/teto branco|teto preto|teto carbono|rodas vermelhas|rodas pretas|rodas douradas|roda vermelha|roda preta|slammed|slamad|rebaixado|socado|pregado|fixa|stock|original/gi, "")
      .trim();
    
    if (!modeloCarro) modeloCarro = "car";

    // 6. ÂNGULO DE CÂMERA
    let anguloCamera = "front three-quarter view showing front grille, hood, roof and side profile";
    if (t.includes("traseira") || t.includes("escapamento") || t.includes("lanterna") || t.includes("porta-mala") || t.includes("aerofólio")) {
      anguloCamera = "rear three-quarter view showing rear lights, trunk, roof and side profile";
    }

    // 7. PROMPT ESTRUTURADO SEM VAZAMENTO
    const promptFlux = `A professional automotive studio photograph of an authentic ${modeloCarro}. 
The car body, doors, and front hood are painted in glossy ${corCorpo}. 
The roof panel is ${detalheTeto}. 
Equipped with ${detalheRodas} and ${postura}. 
Factory emblems, side mirrors, and headlights remain standard. 
Shot from a ${anguloCamera} in a minimalist automotive studio with a solid light grey backdrop and polished floor. Crisp 8k DSLR quality, photorealistic, sharp focus.`;

    // Chamada no Fal.ai (Flux Dev)
    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: promptFlux,
        image_size: "landscape_16_9",
        num_inference_steps: 30,
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
                        
