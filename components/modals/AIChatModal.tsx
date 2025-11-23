import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av'; 
import * as Animatable from 'react-native-animatable';

import { useTheme } from '../../context/ThemeContext';
import { procesarTextoCita, transcribirAudio } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

export default function AIChatModal({ visible, onClose, onSuccess }: any) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false); 
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [posiblesMascotas, setPosiblesMascotas] = useState<any[]>([]);

  // Estados de Grabación
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);

  // Pedir permisos al abrir
  useEffect(() => {
    (async () => {
      if(visible) await Audio.requestPermissionsAsync();
    })();
  }, [visible]);

  // 1. Lógica de IA (Centralizada para reusar)
  const procesarConIA = async (texto: string) => {
    if (!texto.trim()) return;
    
    setLoading(true);
    setAiResponse(null); 
    setPosiblesMascotas([]);
    
    try {
      // Enviamos el texto a Groq (Llama 3)
      const resultado = await procesarTextoCita(texto);
      console.log("Resultado IA:", resultado);
      setAiResponse(resultado);
    } catch (e) {
      Alert.alert("Error", "No pude procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejo del botón enviar (texto manual)
  const handleSend = () => procesarConIA(input);

  // 3. Lógica de Grabación de Voz
  const startRecording = async () => {
    try {
      // Configuración de audio para alta calidad (necesaria para Whisper)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync( 
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Error al iniciar grabación', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI(); 
    setRecording(null);

    if (uri) {
      setLoading(true);
      
      // A. Transcribir audio con Groq Whisper
      const textoTranscrito = await transcribirAudio(uri);
      
      if (textoTranscrito) {
        // Mostramos lo que entendió
        setInput(textoTranscrito); 
        
        // B. ¡MAGIA! Procesamos AUTOMÁTICAMENTE sin esperar clic
        await procesarConIA(textoTranscrito);
        
      } else {
        setLoading(false);
        Alert.alert("Error", "No pude escuchar bien, intenta de nuevo.");
      }
    }
  };

  // 4. Lógica de Base de Datos (Buscar mascota)
  const buscarYConfirmar = async () => {
    if (!aiResponse?.datos?.nombre_mascota) {
      Alert.alert("Faltan datos", "No detecté el nombre de la mascota.");
      return;
    }
    setConfirming(true);
    const { nombre_mascota } = aiResponse.datos;

    try {
      const { data: mascotas, error: searchError } = await supabase
        .from('mascotas')
        .select(`
            id, cliente_id, nombre, raza, 
            clientes (nombres, apellidos)
        `)
        .ilike('nombre', `%${nombre_mascota}%`);

      if (searchError) throw searchError;

      if (!mascotas || mascotas.length === 0) {
        Alert.alert("No encontrada", `No encontré a "${nombre_mascota}".`);
        setConfirming(false);
        return;
      }

      if (mascotas.length === 1) {
        await finalizarAgendamiento(mascotas[0]);
      } else {
        setPosiblesMascotas(mascotas);
        setConfirming(false);
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Error al buscar en la base de datos.");
      setConfirming(false);
    }
  };

  // 5. Guardar Cita Final
  const finalizarAgendamiento = async (mascota: any) => {
    setConfirming(true);
    const { fecha, hora, servicio } = aiResponse.datos;

    try {
        const { error: insertError } = await supabase
            .from('citas')
            .insert({
            mascota_id: mascota.id,
            cliente_id: mascota.cliente_id,
            fecha: fecha,
            hora: hora,
            servicio: servicio,
            estado: 'pendiente',
            notas: 'Agendado por Voz 🎙️'
            });

        if (insertError) throw insertError;

        Alert.alert("¡Éxito!", `Cita agendada para ${mascota.nombre}.`);
        onSuccess(); 
        cerrarTodo();

    } catch (err: any) {
        Alert.alert("Error", err.message);
    } finally {
        setConfirming(false);
    }
  };

  const cerrarTodo = () => {
      onClose();
      setInput('');
      setAiResponse(null);
      setPosiblesMascotas([]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={cerrarTodo}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.card }]}>
          
          <View style={styles.header}>
            <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                <MaterialCommunityIcons name="robot" size={24} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Asistente de Voz</Text>
            </View>
            <TouchableOpacity onPress={cerrarTodo}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatArea} contentContainerStyle={{paddingBottom: 20}}>
            {!aiResponse && !loading ? (
              <View style={styles.emptyState}>
                  {/* Animación visual al grabar */}
                  {isRecording ? (
                    <Animatable.View animation="pulse" iterationCount="infinite" style={styles.recordingCircle}>
                        <MaterialCommunityIcons name="microphone" size={50} color="white" />
                    </Animatable.View>
                  ) : (
                    <MaterialCommunityIcons name="microphone-outline" size={60} color={theme.border} />
                  )}
                  
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 20 }}>
                    {isRecording ? "Escuchando... (Suelta para procesar)" : "Mantén presionado el micro para hablar"}
                  </Text>
              </View>
            ) : (
              <View>
                {/* Si está cargando la IA */}
                {loading && !aiResponse && (
                    <ActivityIndicator size="large" color={theme.primary} style={{marginTop: 20}} />
                )}

                {/* Respuesta IA */}
                {aiResponse && (
                    <>
                        <View style={[styles.msgBubble, { backgroundColor: theme.inputBackground }]}>
                            <Text style={[styles.aiMsg, { color: theme.text }]}>{aiResponse.respuesta_natural}</Text>
                        </View>
                        
                        {/* Tarjeta de Confirmación */}
                        {aiResponse.intent === 'agendar' && posiblesMascotas.length === 0 && (
                        <View style={[styles.previewCard, { borderColor: theme.primary, backgroundColor: theme.card }]}>
                            <Text style={[styles.cardTitle, { color: theme.primary }]}>Datos Detectados:</Text>
                            <Text style={{color: theme.text}}>🐶 {aiResponse.datos.nombre_mascota}</Text>
                            <Text style={{color: theme.text}}>📅 {aiResponse.datos.fecha} - ⏰ {aiResponse.datos.hora}</Text>
                            <Text style={{color: theme.text}}>✂️ {aiResponse.datos.servicio}</Text>
                            
                            <TouchableOpacity style={[styles.btnConfirm, { backgroundColor: theme.primary }]} onPress={buscarYConfirmar} disabled={confirming}>
                            {confirming ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirmar</Text>}
                            </TouchableOpacity>
                        </View>
                        )}

                        {/* Lista de Duplicados */}
                        {posiblesMascotas.length > 0 && (
                            <View style={[styles.previewCard, { borderColor: 'orange' }]}>
                                <Text style={[styles.cardTitle, { color: 'orange' }]}>Selecciona la mascota correcta:</Text>
                                {posiblesMascotas.map((pet) => (
                                    <TouchableOpacity key={pet.id} style={[styles.duplicateItem, { backgroundColor: theme.inputBackground }]} onPress={() => finalizarAgendamiento(pet)}>
                                        <Text style={{fontWeight:'bold', color: theme.text}}>{pet.nombre} <Text style={{fontWeight:'normal', fontSize:12}}>({pet.clientes?.nombres})</Text></Text>
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}
              </View>
            )}
          </ScrollView>

          {/* BARRA DE ENTRADA */}
          <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder="Escribe o habla..."
              placeholderTextColor={theme.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
            />
            
            {input.length > 0 ? (
               <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={handleSend}>
                  <MaterialCommunityIcons name="send" size={20} color="white" />
               </TouchableOpacity>
            ) : (
               // BOTÓN MICROFONO (Lógica: Press In -> Graba, Press Out -> Envía Automáticamente)
               <TouchableOpacity 
                  style={[styles.micBtn, { backgroundColor: isRecording ? '#F44336' : theme.primary }]} 
                  onPressIn={startRecording}
                  onPressOut={stopRecording}
                  activeOpacity={0.8}
               >
                  <MaterialCommunityIcons name={isRecording ? "stop" : "microphone"} size={24} color="white" />
               </TouchableOpacity>
            )}
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  container: { height: '65%', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold' },
  chatArea: { flex: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 40, opacity: 0.8 },
  recordingCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F44336', justifyContent: 'center', alignItems: 'center', elevation: 5, marginBottom: 10 },
  
  msgBubble: { padding: 15, borderRadius: 15, borderBottomLeftRadius: 0, marginBottom: 15 },
  aiMsg: { fontSize: 16, lineHeight: 22 },
  previewCard: { borderWidth: 2, borderRadius: 15, padding: 15, gap: 5, elevation: 2, marginBottom: 20 },
  cardTitle: { fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
  btnConfirm: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  duplicateItem: { flexDirection: 'row', justifyContent:'space-between', alignItems:'center', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

  inputRow: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1, alignItems: 'center' },
  input: { flex: 1, borderRadius: 25, paddingHorizontal: 20, height: 50, fontSize: 16 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  micBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 4 }
});