// lib/gemini.ts (Usando Groq Llama 3.3)

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const SERVICIOS_DISPONIBLES = [
  'BAÑO',
  'BAÑO Y CORTE',
  'SERVICIO DE COLORIMETRÍA',
  'CORTE DE UÑAS',
  'DESPARASITACIÓN',
  'LIMPIEZA DE OÍDOS'
];

export const procesarTextoCita = async (textoUsuario: string) => {
  console.log("🚀 Consultando a Groq (Llama 3.3)...");

  if (!API_KEY) {
    console.error("❌ Falta la API Key de Groq");
    return { intent: "error", respuesta_natural: "Falta configurar la API Key." };
  }

  const fechaHoy = new Date().toISOString();

  // Prompt del Sistema
  const systemPrompt = `
    Eres un asistente administrativo de la veterinaria "VeterinariaPet".
    Hoy es: ${fechaHoy}.
    Servicios válidos: ${SERVICIOS_DISPONIBLES.join(', ')}.

    Tu tarea es extraer datos del mensaje del usuario para agendar una cita.
    
    IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido.
    
    Estructura JSON requerida:
    {
      "intent": "agendar",
      "datos": {
        "nombre_mascota": "string o null",
        "fecha": "YYYY-MM-DD o null",
        "hora": "HH:MM (24h) o null",
        "servicio": "string o null"
      },
      "respuesta_natural": "Una frase corta confirmando lo entendido."
    }
  `;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        // CAMBIO AQUÍ: Usamos el modelo más nuevo y soportado
        model: "llama-3.3-70b-versatile", 
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: textoUsuario }
        ],
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq API Error: ${err}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log("✅ Respuesta Groq:", content);
    return JSON.parse(content);

  } catch (error) {
    console.error("❌ Error en IA:", error);
    return {
      intent: "error",
      datos: {},
      respuesta_natural: "Ocurrió un error al procesar tu solicitud. Intenta de nuevo."
    };
  }
};