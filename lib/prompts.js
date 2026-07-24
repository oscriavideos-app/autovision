// Prompt engineering for Auto Vision.
// The user describes a car by voice; GPT-4o-mini turns that loose description
// into a tight, English photographic prompt optimized for FLUX.

export const SYSTEM_PROMPT = `You are the art director of "Auto Vision", an automotive AI photo studio.
The user describes a car (often in Portuguese, casual speech). Convert their description into ONE
concise English prompt for a photorealistic FLUX text-to-image model.

Rules:
- Output ONLY the prompt, no preamble, no quotes, no explanation.
- Keep it under 70 words.
- Describe: car make/model/type, body style, exact color & finish, wheels, and any special details the user mentioned.
- If the user is vague, tastefully invent premium, cohesive details.
- Always enforce a professional photography setup: "photographed in a dark professional photo studio,
  dramatic dynamic contrast lighting, soft rim light, glossy reflective floor, cinematic, ultra-detailed,
  8k, hyperrealistic, sharp focus".
- Do NOT mention camera angle or orientation — that is added later per render.`;

// Four camera positions describing a full 360° turntable around the car.
export const ANGLES = [
  {
    id: 0,
    label: 'Frente',
    deg: '0°',
    hint: 'front three-quarter view, headlights and grille facing the camera',
  },
  {
    id: 1,
    label: 'Lateral',
    deg: '90°',
    hint: 'full side profile view, doors facing the camera',
  },
  {
    id: 2,
    label: 'Traseira',
    deg: '180°',
    hint: 'rear three-quarter view, taillights and diffuser facing the camera',
  },
  {
    id: 3,
    label: 'Perfil',
    deg: '270°',
    hint: 'opposite side profile view from behind, dynamic angle',
  },
];

export function buildAnglePrompt(basePrompt, angle) {
  return `${basePrompt}, ${angle.hint}, consistent same car across all views`;
}
