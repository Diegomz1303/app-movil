import React, { useState } from 'react';
import { 
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { procesarTextoCita } from '../../lib/gemini';
import { supabase } from '../../lib/supabase';

export default function AIChatModal({ visible, onClose, onSuccess }: any) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false); 
  const [aiResponse, setAiResponse] = useState<any>(null);
  
  // NUEVO: Estado para manejar duplicados
  const [posiblesMascotas, setPosiblesMascotas] = useState<any[]>([]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setAiResponse(null); 
    setPosiblesMascotas([]); // Limpiar duplicados previos
    
    try {
      const resultado = await procesarTextoCita(input);
      console.log("Resultado IA:", resultado);
      setAiResponse(resultado);
    } catch (e) {
      Alert.alert("Error", "No pude procesar tu solicitud.");
    } finally {
      setLoading(false);
    }
  };

  // Paso 1: Buscar mascota(s)
  const buscarYConfirmar = async () => {
    if (!aiResponse?.datos?.nombre_mascota) {
      Alert.alert("Faltan datos", "No detecté el nombre de la mascota.");
      return;
    }

    setConfirming(true);
    const { nombre_mascota } = aiResponse.datos;

    try {
      // CAMBIO IMPORTANTE: Traemos también datos del dueño y QUITAMOS el .limit(1)
      const { data: mascotas, error: searchError } = await supabase
        .from('mascotas')
        .select(`
            id, 
            cliente_id, 
            nombre, 
            raza,
            clientes (nombres, apellidos)
        `)
        .ilike('nombre', `%${nombre_mascota}%`);

      if (searchError) throw searchError;

      if (!mascotas || mascotas.length === 0) {
        Alert.alert("No encontrada", `No encontré a "${nombre_mascota}". Revisa el nombre.`);
        setConfirming(false);
        return;
      }

      if (mascotas.length === 1) {
        // CASO IDEAL: Solo hay uno, agendamos directo
        await finalizarAgendamiento(mascotas[0]);
      } else {
        // CASO DUPLICADOS: Hay más de uno, mostramos lista para elegir
        setPosiblesMascotas(mascotas);
        setConfirming(false); // Dejamos de cargar para que el usuario elija
      }

    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", "Error al buscar en la base de datos.");
      setConfirming(false);
    }
  };

  // Paso 2: Guardar la cita (se llama al elegir o si solo hay uno)
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
            notas: 'Agendado vía Asistente IA 🤖'
            });

        if (insertError) throw insertError;

        Alert.alert("¡Éxito!", `Cita agendada para ${mascota.nombre} (Dueño: ${mascota.clientes?.nombres}).`);
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
                <Text style={[styles.title, { color: theme.text }]}>Asistente IA</Text>
            </View>
            <TouchableOpacity onPress={cerrarTodo}>
                <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.chatArea} contentContainerStyle={{paddingBottom: 20}}>
            {!aiResponse ? (
              <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="text-box-search-outline" size={50} color={theme.border} />
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 10 }}>
                    Escribe algo como:{"\n"}"Agendar corte para Diego mañana a las 4pm"
                  </Text>
              </View>
            ) : (
              <View>
                <View style={[styles.msgBubble, { backgroundColor: theme.inputBackground }]}>
                    <Text style={[styles.aiMsg, { color: theme.text }]}>{aiResponse.respuesta_natural}</Text>
                </View>
                
                {/* CASO 1: MOSTRAR DATOS PARA CONFIRMAR */}
                {aiResponse.intent === 'agendar' && posiblesMascotas.length === 0 && (
                  <View style={[styles.previewCard, { borderColor: theme.primary, backgroundColor: theme.card }]}>
                    <Text style={[styles.cardTitle, { color: theme.primary }]}>Datos Detectados:</Text>
                    <Text style={{color: theme.text}}>🐶 {aiResponse.datos.nombre_mascota}</Text>
                    <Text style={{color: theme.text}}>📅 {aiResponse.datos.fecha} - ⏰ {aiResponse.datos.hora}</Text>
                    <Text style={{color: theme.text}}>✂️ {aiResponse.datos.servicio}</Text>
                    
                    <TouchableOpacity 
                        style={[styles.btnConfirm, { backgroundColor: theme.primary }]} 
                        onPress={buscarYConfirmar}
                        disabled={confirming}
                    >
                      {confirming ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Confirmar</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {/* CASO 2: MOSTRAR LISTA DE DUPLICADOS SI EXISTEN */}
                {posiblesMascotas.length > 0 && (
                    <View style={[styles.previewCard, { borderColor: 'orange', backgroundColor: theme.card }]}>
                        <View style={{flexDirection:'row', gap:5, marginBottom:5}}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="orange" />
                            <Text style={[styles.cardTitle, { color: 'orange' }]}>¿Cuál "{aiResponse.datos.nombre_mascota}"?</Text>
                        </View>
                        <Text style={{color: theme.textSecondary, marginBottom: 10}}>Encontré varios. Selecciona el correcto:</Text>
                        
                        {posiblesMascotas.map((pet) => (
                            <TouchableOpacity 
                                key={pet.id} 
                                style={[styles.duplicateItem, { backgroundColor: theme.inputBackground }]}
                                onPress={() => finalizarAgendamiento(pet)}
                            >
                                <View>
                                    <Text style={{fontWeight:'bold', color: theme.text}}>{pet.nombre}</Text>
                                    <Text style={{fontSize:12, color: theme.textSecondary}}>
                                        Dueño: {pet.clientes?.nombres} {pet.clientes?.apellidos}
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

              </View>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.text }]}
              placeholder="Escribe aquí..."
              placeholderTextColor={theme.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="white" /> : <MaterialCommunityIcons name="send" size={20} color="white" />}
            </TouchableOpacity>
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
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.7 },
  msgBubble: { padding: 15, borderRadius: 15, borderBottomLeftRadius: 0, marginBottom: 15 },
  aiMsg: { fontSize: 16, lineHeight: 22 },
  previewCard: { borderWidth: 2, borderRadius: 15, padding: 15, gap: 5, elevation: 2, marginBottom: 20 },
  cardTitle: { fontWeight: 'bold', marginBottom: 5, fontSize: 14 },
  btnConfirm: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  
  // Estilos nuevos para duplicados
  duplicateItem: { 
      flexDirection: 'row', justifyContent:'space-between', alignItems:'center',
      padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)'
  },

  inputRow: { flexDirection: 'row', gap: 10, paddingTop: 15, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 25, paddingHorizontal: 20, height: 50, fontSize: 16 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 }
});