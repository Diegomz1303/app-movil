import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
  TouchableWithoutFeedback, FlatList, Animated, Dimensions
} from 'react-native';
import { Audio } from 'expo-av';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../context/ThemeContext';
import { COLORES } from '../../constants/colors';
import { procesarTextoCita, transcribirAudio } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

// --- ESTRUCTURAS DE DATOS ---
interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  type?: 'text' | 'audio_placeholder' | 'thinking' | 'options';
  options?: any[]; 
}

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AIChatModal({ visible, onClose, onSuccess }: AIChatModalProps) {
  const { theme, isDark } = useTheme();
  
  // Animación de Rebote (Spring)
  const scaleValue = useRef(new Animated.Value(0)).current;

  // Estados Audio
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  
  // Estados Lógica
  const [processing, setProcessing] = useState(false);
  const [appointmentData, setAppointmentData] = useState<any>(null);
  
  // NUEVO: Estado temporal para guardar datos de la IA mientras resolvemos duplicados
  const [tempAiData, setTempAiData] = useState<any>(null);
  
  // Estados Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  const flatListRef = useRef<FlatList>(null);
  const animationRef = useRef<LottieView>(null);

  // Efecto de Entrada (Rebote) y Reset
  useEffect(() => {
    if (visible) {
      setMessages([{
        id: 'welcome',
        text: '¡Hola! 🤖 Soy tu asistente de OhMyPet. Dime algo como: "Agendar baño y corte para Bobby mañana a las 10".',
        sender: 'ai'
      }]);
      setAppointmentData(null);
      setTempAiData(null);
      setInputText('');
      setProcessing(false);

      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Scroll automático
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages]);

  // Animación Lottie al grabar
  useEffect(() => {
    if (recording && animationRef.current) animationRef.current.play();
    else if (animationRef.current) animationRef.current.reset();
   }, [recording]);

  // --- AUDIO ---
  async function startRecording() {
    try {
        if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (permissionResponse?.status !== 'granted') await requestPermission();

        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

        addMessage('...', 'user', 'audio_placeholder');

        const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
        setRecording(recording);
    } catch (err) {
        Alert.alert('Error', 'No se pudo iniciar el micrófono.');
        setMessages(prev => prev.filter(m => m.type !== 'audio_placeholder'));
    }
  }

  async function stopRecording() {
    if (!recording) return;
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setRecording(null);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();

    if (uri) processAudioFlow(uri);
  }

  // --- FLUJO PRINCIPAL ---
  const processAudioFlow = async (audioUri: string) => {
    setProcessing(true);
    setMessages(prev => prev.map(m => m.type === 'audio_placeholder' ? { ...m, text: 'Escuchando...', type: 'thinking' } : m));

    try {
      const textoTranscrito = await transcribirAudio(audioUri);
      setMessages(prev => prev.filter(m => m.type !== 'thinking')); 

      if (!textoTranscrito) {
          addMessage("No pude escuchar nada. Intenta de nuevo.", 'ai');
          return;
      }

      addMessage(textoTranscrito, 'user');
      await processTextFlow(textoTranscrito);

    } catch (error) {
      setMessages(prev => prev.filter(m => m.type !== 'thinking'));
      addMessage("Error técnico al procesar el audio.", 'ai');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendText = async () => {
      if(!inputText.trim()) return;
      const text = inputText;
      setInputText('');
      addMessage(text, 'user');
      setProcessing(true);
      await processTextFlow(text);
      setProcessing(false);
  };

  const processTextFlow = async (text: string) => {
      const loadingId = Date.now().toString();
      setMessages(prev => [...prev, { id: loadingId, text: '...', sender: 'ai', type: 'thinking' }]);

      try {
          const result = await procesarTextoCita(text);
          setMessages(prev => prev.filter(m => m.id !== loadingId));

          if (result.intent === 'agendar' && result.datos) {
              if (result.datos.nombre_mascota) {
                  // Guardamos los datos que entendió la IA (servicio, fecha, hora)
                  setTempAiData(result.datos); 
                  await buscarMascotaEnBD(result.datos, result.respuesta_natural);
              } else {
                  addMessage(result.respuesta_natural || "Faltan datos. ¿Cuál es el nombre de la mascota?", 'ai');
              }
          } else {
              addMessage(result.respuesta_natural || "No entendí muy bien. ¿Podrías repetir?", 'ai');
          }

      } catch (e) {
          setMessages(prev => prev.filter(m => m.id !== loadingId));
          addMessage("Tuve un problema conectando con el cerebro de la IA.", 'ai');
      }
  };

  // --- LÓGICA DE DUPLICADOS Y BÚSQUEDA ---
  const buscarMascotaEnBD = async (datosIA: any, respuestaIA: string) => {
      if(!datosIA.nombre_mascota) return;

      const { data: mascotas, error } = await supabase
          .from('mascotas')
          .select('id, nombre, raza, cliente_id, clientes (nombres, apellidos)')
          .ilike('nombre', `%${datosIA.nombre_mascota}%`);

      if (error || !mascotas || mascotas.length === 0) {
          addMessage(`No encontré ninguna mascota llamada "${datosIA.nombre_mascota}". ¿Es un cliente nuevo?`, 'ai');
          return;
      }

      // CASO 1: Solo una coincidencia
      if (mascotas.length === 1) {
          const mascota = mascotas[0];
          addMessage(respuestaIA || `Entendido, agendando para ${mascota.nombre}.`, 'ai');
          
          const clienteInfo = mascota.clientes 
            ? `${(mascota.clientes as any).nombres} ${(mascota.clientes as any).apellidos}` 
            : 'Sin dueño';

          setAppointmentData({
              ...datosIA, // Aquí viene el servicio correcto ("Baño y Corte")
              mascota_id: mascota.id,
              cliente_id: mascota.cliente_id,
              nombre_mascota: mascota.nombre, 
              cliente_nombre: clienteInfo,
              requiresConfirmation: true
          });
      
      // CASO 2: Múltiples coincidencias
      } else {
          addMessage(`Encontré ${mascotas.length} mascotas llamadas "${datosIA.nombre_mascota}". ¿A cuál te refieres?`, 'ai');
          
          setMessages(prev => [...prev, {
              id: Date.now().toString(),
              text: 'Selecciona una mascota:',
              sender: 'ai',
              type: 'options',
              options: mascotas.map(m => {
                  const owner = m.clientes 
                    ? `Dueño: ${(m.clientes as any).nombres} ${(m.clientes as any).apellidos}` 
                    : 'Sin dueño';
                  
                  return {
                    id: m.id,
                    label: `${m.nombre} (${m.raza})`,
                    subLabel: owner,
                    originalData: m
                  };
              })
          }]);
      }
  };

  const handleSelectDuplicate = (mascotaBD: any) => {
      const ownerName = mascotaBD.clientes 
        ? (mascotaBD.clientes as any).nombres 
        : 'sin dueño';

      addMessage(`El de ${ownerName}.`, 'user');
      
      const clienteFullName = mascotaBD.clientes 
        ? `${(mascotaBD.clientes as any).nombres} ${(mascotaBD.clientes as any).apellidos}` 
        : 'Sin dueño';

      // Usamos tempAiData para recuperar la fecha, hora y servicio originales
      // Si por alguna razón se perdió, usamos valores por defecto seguros.
      const datosFinales = tempAiData || { fecha: new Date().toISOString().split('T')[0], hora: '09:00', servicio: 'Consulta' };

      setAppointmentData({
          ...datosFinales, // Aquí recuperamos "Baño y Corte"
          mascota_id: mascotaBD.id,
          cliente_id: mascotaBD.cliente_id,
          nombre_mascota: mascotaBD.nombre,
          cliente_nombre: clienteFullName,
          requiresConfirmation: true
      });
  };

  // --- GUARDAR EN BD ---
  const handleConfirmSave = async () => {
      if(!appointmentData?.mascota_id) return;
      
      setProcessing(true);
      try {
          const { error } = await supabase.from('citas').insert({
              mascota_id: appointmentData.mascota_id,
              cliente_id: appointmentData.cliente_id,
              fecha: appointmentData.fecha,
              hora: appointmentData.hora,
              servicio: appointmentData.servicio, // Ahora sí debería ser el correcto
              estado: 'pendiente',
              notas: 'Agendado por IA'
          });

          if(error) throw error;

          addMessage("¡Listo! Cita agendada. ✅", 'ai');
          setAppointmentData(null);
          if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          setTimeout(() => {
              onSuccess();
              onClose();
          }, 1500);
      } catch (e) {
          Alert.alert("Error", "No se pudo guardar la cita.");
      } finally {
          setProcessing(false);
      }
  };

  const addMessage = (text: string, sender: 'user' | 'ai', type: any = 'text') => {
      setMessages(prev => [...prev, { id: Date.now().toString(), text, sender, type }]);
  };

  // --- RENDERIZADO ---
  const renderItem = ({ item }: { item: ChatMessage }) => {
      if (item.type === 'thinking' || item.type === 'audio_placeholder') {
          return (
            <View style={[styles.bubbleWrap, item.sender === 'user' ? styles.userWrap : styles.aiWrap]}>
                <View style={[styles.bubble, { backgroundColor: item.sender === 'user' ? theme.primary : theme.inputBackground }]}>
                    <ActivityIndicator size="small" color={item.sender === 'user' ? 'white' : theme.text} />
                </View>
            </View>
          );
      }

      if (item.type === 'options' && item.options) {
          return (
              <View style={styles.optionsContainer}>
                  <Text style={[styles.optionsTitle, { color: theme.textSecondary }]}>{item.text}</Text>
                  {item.options.map((opt, idx) => (
                      <TouchableOpacity 
                          key={idx} 
                          style={[styles.optionBtn, { backgroundColor: theme.card, borderColor: theme.primary }]}
                          onPress={() => handleSelectDuplicate(opt.originalData)}
                      >
                          <Text style={[styles.optionLabel, { color: theme.text }]}>{opt.label}</Text>
                          <Text style={[styles.optionSub, { color: theme.textSecondary }]}>{opt.subLabel}</Text>
                      </TouchableOpacity>
                  ))}
              </View>
          );
      }

      return (
          <View style={[styles.bubbleWrap, item.sender === 'user' ? styles.userWrap : styles.aiWrap]}>
              {item.sender === 'ai' && (
                  <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                      <MaterialCommunityIcons name="robot" size={16} color="white" />
                  </View>
              )}
              <View style={[
                  styles.bubble, 
                  item.sender === 'user' 
                    ? { backgroundColor: theme.primary, borderBottomRightRadius: 2 } 
                    : { backgroundColor: theme.inputBackground, borderBottomLeftRadius: 2 }
              ]}>
                  <Text style={{ color: item.sender === 'user' ? 'white' : theme.text, fontSize: 15 }}>{item.text}</Text>
              </View>
          </View>
      );
  };

  const renderConfirmation = () => {
      if(!appointmentData || !appointmentData.requiresConfirmation) return null;
      return (
          <Animated.View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Confirmar Datos</Text>
                  <MaterialCommunityIcons name="check-decagram" size={20} color={theme.primary} />
              </View>
              
              <View style={{gap: 8, marginBottom: 15}}>
                  <Text style={{color: theme.textSecondary}}>🐶 Mascota: <Text style={{fontWeight:'bold', color: theme.text}}>{appointmentData.nombre_mascota}</Text></Text>
                  <Text style={{color: theme.textSecondary}}>👤 Dueño: <Text style={{fontWeight:'bold', color: theme.text}}>{appointmentData.cliente_nombre}</Text></Text>
                  <Text style={{color: theme.textSecondary}}>📅 Fecha: <Text style={{fontWeight:'bold', color: theme.text}}>{appointmentData.fecha}</Text></Text>
                  <Text style={{color: theme.textSecondary}}>⏰ Hora: <Text style={{fontWeight:'bold', color: theme.text}}>{appointmentData.hora}</Text></Text>
                  <Text style={{color: theme.textSecondary}}>✂️ Servicio: <Text style={{fontWeight:'bold', color: theme.text}}>{appointmentData.servicio}</Text></Text>
              </View>

              <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity style={[styles.btn, {borderColor: theme.border, borderWidth: 1}]} onPress={() => { setAppointmentData(null); addMessage("Cancelado.", 'ai'); }}>
                      <Text style={{color: theme.textSecondary}}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, {backgroundColor: theme.primary}]} onPress={handleConfirmSave}>
                      <Text style={{color: 'white', fontWeight: 'bold'}}>Confirmar</Text>
                  </TouchableOpacity>
              </View>
          </Animated.View>
      );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
            <TouchableWithoutFeedback onPress={onClose}><View style={styles.backdrop} /></TouchableWithoutFeedback>
            
            {/* Modal con Animación de Rebote */}
            <Animated.View style={[
                styles.modalView, 
                { 
                    backgroundColor: theme.background,
                    transform: [{ scale: scaleValue }] 
                }
            ]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                        <MaterialCommunityIcons name="robot-happy-outline" size={24} color={theme.primary} />
                        <Text style={[styles.title, { color: theme.text }]}>Asistente IA</Text>
                    </View>
                    <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary}/></TouchableOpacity>
                </View>

                {/* Chat Area */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15, paddingBottom: 20 }}
                    ListFooterComponent={renderConfirmation}
                />

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                    <TextInput 
                        style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
                        placeholder="Escribe o usa el micrófono..."
                        placeholderTextColor={theme.textSecondary}
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSendText}
                    />
                    
                    {inputText.length > 0 ? (
                        <TouchableOpacity style={[styles.circleBtn, { backgroundColor: theme.primary }]} onPress={handleSendText}>
                            <MaterialCommunityIcons name="send" size={20} color="white" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            style={[styles.circleBtn, { backgroundColor: recording ? COLORES.danger : theme.primary }]}
                            onPressIn={startRecording}
                            onPressOut={stopRecording}
                        >
                            {recording ? (
                                <LottieView source={require('../../assets/pet-animation.json')} autoPlay loop style={{width: 30, height: 30}} />
                            ) : (
                                <MaterialCommunityIcons name="microphone" size={24} color="white" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  
  modalView: {
    width: width * 0.9,
    height: height * 0.8,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10,
  },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  // Chat
  bubbleWrap: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  userWrap: { justifyContent: 'flex-end' },
  aiWrap: { justifyContent: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  bubble: { padding: 12, borderRadius: 18, maxWidth: '80%' },
  
  // Opciones (Duplicados)
  optionsContainer: { marginLeft: 36, marginBottom: 15 },
  optionsTitle: { marginBottom: 8, fontSize: 14, fontStyle:'italic' },
  optionBtn: { padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 6 },
  optionLabel: { fontWeight: 'bold', fontSize: 14 },
  optionSub: { fontSize: 12 },

  // Card Confirmación
  card: { marginTop: 10, padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  // Input
  inputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, alignItems: 'center', gap: 10 },
  input: { flex: 1, height: 45, borderRadius: 25, paddingHorizontal: 15 },
  circleBtn: { width: 45, height: 45, borderRadius: 25, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }
});