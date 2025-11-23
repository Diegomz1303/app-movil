// lib/gemini.ts

const API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

const SERVICIOS_DISPONIBLES = [
  'BAÑO',
  'BAÑO Y CORTE',
  'SERVICIO DE COLORIMETRÍA',
  'CORTE DE UÑAS',
  'DESPARASITACIÓN',
  'LIMPIEZA DE OÍDOS'
];

// 1. Función para procesar texto a JSON (Llama 3)
export const procesarTextoCita = async (textoUsuario: string) => {
  console.log("🚀 Consultando a Groq (Llama 3.3)...");

  if (!API_KEY) {
    console.error("❌ Falta la API Key de Groq");
    return { intent: "error", respuesta_natural: "Falta configurar la API Key." };
  }

  const fechaHoy = new Date().toISOString();

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

// 2. Función para transcribir audio (Whisper)
export const transcribirAudio = async (uri: string) => {
  console.log("🎙️ Transcribiendo audio con Groq Whisper...");

  if (!API_KEY) return null;

  const formData = new FormData();
  
  // @ts-ignore - Expo acepta este formato aunque TS se queje
  formData.append('file', {
    uri: uri,
    name: 'recording.m4a',
    type: 'audio/m4a'
  });
  
  formData.append('model', 'whisper-large-v3');
  formData.append('temperature', '0');
  formData.append('response_format', 'json');
  formData.append('language', 'es'); 

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: formData
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Groq Whisper Error: ${err}`);
    }

    const data = await response.json();
    console.log("🗣️ Texto detectado:", data.text);
    return data.text;

  } catch (error) {
    console.error("❌ Error transcribiendo:", error);
    return null;
  }
};