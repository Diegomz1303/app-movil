import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

// Tipos de datos
type SimpleClient = { id: number; nombres: string; apellidos: string };
type SimplePet = { id: number; nombre: string };

interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAppointmentAdded?: () => void;
}

const SERVICIOS = [
  'BAÑO',
  'BAÑO Y CORTE',
  'SERVICIO DE COLORIMETRÍA',
  'CORTE DE UÑAS',
  'DESPARASITACIÓN',
  'CONSULTA VETERINARIA'
];

const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function AddAppointmentModal({ visible, onClose, onAppointmentAdded }: AddAppointmentModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  // Data Lists
  const [clientsList, setClientsList] = useState<SimpleClient[]>([]);
  const [petsList, setPetsList] = useState<SimplePet[]>([]);

  // Form States
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientNameDisplay, setClientNameDisplay] = useState('');
  
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [petNameDisplay, setPetNameDisplay] = useState('');

  const [date, setDate] = useState(new Date());
  const [fechaText, setFechaText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [hora, setHora] = useState('');
  const [servicio, setServicio] = useState('');
  const [notas, setNotas] = useState('');

  // Control de Dropdowns (Acordeones)
  const [showClientDrop, setShowClientDrop] = useState(false);
  const [showPetDrop, setShowPetDrop] = useState(false);
  const [showTimeDrop, setShowTimeDrop] = useState(false);
  const [showServiceDrop, setShowServiceDrop] = useState(false);

  useEffect(() => {
    if (visible) {
      limpiarFormulario();
      fetchClients();
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, nombres, apellidos')
      .order('nombres', { ascending: true });
    
    if (!error && data) setClientsList(data);
  };

  const fetchPets = async (clientId: number) => {
    const { data, error } = await supabase
      .from('mascotas')
      .select('id, nombre')
      .eq('cliente_id', clientId);
    
    if (!error && data) setPetsList(data);
    else setPetsList([]);
  };

  const handleClientSelect = (client: SimpleClient) => {
    setSelectedClientId(client.id);
    setClientNameDisplay(`${client.nombres} ${client.apellidos}`);
    setShowClientDrop(false);
    setSelectedPetId(null);
    setPetNameDisplay('');
    fetchPets(client.id);
  };

  // --- AQUÍ ESTÁ LA CORRECCIÓN DE LA FECHA ---
  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      
      // Usamos métodos locales (getFullYear, getMonth, getDate)
      // Esto asegura que la fecha sea la del dispositivo, no UTC.
      const year = selectedDate.getFullYear();
      // getMonth() devuelve 0-11, por eso sumamos 1
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      // Formato estándar para base de datos: YYYY-MM-DD
      const formatted = `${year}-${month}-${day}`;
      setFechaText(formatted);
    }
  };

  const handleSave = async () => {
    if (!selectedClientId || !selectedPetId || !fechaText || !hora || !servicio) {
      Alert.alert("Faltan datos", "Por favor completa todos los campos marcados con *");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('citas').insert({
      cliente_id: selectedClientId,
      mascota_id: selectedPetId,
      fecha: fechaText,
      hora: hora,
      servicio: servicio,
      notas: notas,
      estado: 'pendiente'
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("¡Listo!", "Cita agendada correctamente.");
      if (onAppointmentAdded) onAppointmentAdded();
      onClose();
    }
  };

  const limpiarFormulario = () => {
    setSelectedClientId(null);
    setClientNameDisplay('');
    setSelectedPetId(null);
    setPetNameDisplay('');
    setFechaText('');
    setHora('');
    setServicio('');
    setNotas('');
    setDate(new Date());
    
    // Cerrar todos los acordeones
    setShowClientDrop(false);
    setShowPetDrop(false);
    setShowTimeDrop(false);
    setShowServiceDrop(false);
  };

  // Función auxiliar para cerrar otros al abrir uno
  const toggleDropdown = (type: 'client' | 'pet' | 'time' | 'service') => {
    if (type === 'client') {
        setShowClientDrop(!showClientDrop);
        setShowPetDrop(false); setShowTimeDrop(false); setShowServiceDrop(false);
    } else if (type === 'pet') {
        setShowPetDrop(!showPetDrop);
        setShowClientDrop(false); setShowTimeDrop(false); setShowServiceDrop(false);
    } else if (type === 'time') {
        setShowTimeDrop(!showTimeDrop);
        setShowClientDrop(false); setShowPetDrop(false); setShowServiceDrop(false);
    } else if (type === 'service') {
        setShowServiceDrop(!showServiceDrop);
        setShowClientDrop(false); setShowPetDrop(false); setShowTimeDrop(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Agendar Nueva Cita</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subTitleHeader}>Completa los datos para registrar una cita</Text>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
          >
            
            {/* 1. CLIENTE */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>1. Cliente *</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, showClientDrop && styles.dropdownActive]} 
                onPress={() => toggleDropdown('client')}
              >
                <Text style={[styles.inputText, !clientNameDisplay && { color: '#CCC' }]}>
                    {clientNameDisplay || 'Selecciona un cliente...'}
                </Text>
                <MaterialCommunityIcons name={showClientDrop ? "chevron-up" : "chevron-down"} size={20} color={COLORES.texto} />
              </TouchableOpacity>
              
              {showClientDrop && (
                <View style={styles.accordionContent}>
                    {clientsList.map(client => (
                      <TouchableOpacity key={client.id} style={styles.dropdownItem} onPress={() => handleClientSelect(client)}>
                        <Text style={styles.dropdownItemText}>{client.nombres} {client.apellidos}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            {/* 2. MASCOTA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>2. Mascota *</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, showPetDrop && styles.dropdownActive, !selectedClientId && { backgroundColor: '#F5F5F5' }]} 
                onPress={() => { 
                    if(selectedClientId) toggleDropdown('pet');
                    else Alert.alert("Aviso", "Primero selecciona un cliente"); 
                }}
              >
                <Text style={[styles.inputText, !petNameDisplay && { color: '#CCC' }]}>
                    {petNameDisplay || 'Selecciona una mascota...'}
                </Text>
                <MaterialCommunityIcons name={showPetDrop ? "chevron-up" : "chevron-down"} size={20} color={COLORES.texto} />
              </TouchableOpacity>

              {showPetDrop && (
                <View style={styles.accordionContent}>
                   {petsList.length > 0 ? petsList.map(pet => (
                      <TouchableOpacity key={pet.id} style={styles.dropdownItem} onPress={() => { setSelectedPetId(pet.id); setPetNameDisplay(pet.nombre); setShowPetDrop(false); }}>
                        <Text style={styles.dropdownItemText}>{pet.nombre}</Text>
                      </TouchableOpacity>
                   )) : (
                       <Text style={{ padding: 12, color: '#999', fontStyle: 'italic' }}>Este cliente no tiene mascotas registradas.</Text>
                   )}
                </View>
              )}
            </View>

            {/* 3. FECHA Y HORA */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>3. Fecha *</Text>
                    <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDatePicker(true)}>
                        <Text style={[styles.inputText, !fechaText && { color: '#CCC' }]}>
                            {fechaText || 'YYYY-MM-DD'}
                        </Text>
                        <MaterialCommunityIcons name="calendar" size={20} color={COLORES.texto} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} minimumDate={new Date()} />
                    )}
                </View>

                <View style={styles.halfInput}>
                    <Text style={styles.label}>4. Hora *</Text>
                    <TouchableOpacity 
                        style={[styles.dropdownButton, showTimeDrop && styles.dropdownActive]} 
                        onPress={() => toggleDropdown('time')}
                    >
                         <Text style={[styles.inputText, !hora && { color: '#CCC' }]}>
                            {hora || 'Hora...'}
                        </Text>
                        <MaterialCommunityIcons name={showTimeDrop ? "clock" : "clock-outline"} size={20} color={COLORES.texto} />
                    </TouchableOpacity>
                </View>
            </View>
            
            {/* LISTA DE HORAS */}
            {showTimeDrop && (
                <View style={[styles.accordionContent, { marginTop: -10, marginBottom: 15 }]}>
                    <View style={styles.gridContainer}>
                        {HORARIOS.map(h => (
                            <TouchableOpacity 
                                key={h} 
                                style={[styles.timeChip, hora === h && styles.timeChipActive]} 
                                onPress={() => { setHora(h); setShowTimeDrop(false); }}
                            >
                                <Text style={[styles.timeChipText, hora === h && { color: 'white' }]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* 5. SERVICIO */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>5. Servicio *</Text>
              <TouchableOpacity 
                style={[styles.dropdownButton, showServiceDrop && styles.dropdownActive]} 
                onPress={() => toggleDropdown('service')}
              >
                <Text style={[styles.inputText, !servicio && { color: '#CCC' }]}>
                    {servicio || 'Selecciona un servicio...'}
                </Text>
                <MaterialCommunityIcons name={showServiceDrop ? "chevron-up" : "chevron-down"} size={20} color={COLORES.texto} />
              </TouchableOpacity>
              
              {showServiceDrop && (
                <View style={styles.accordionContent}>
                    {SERVICIOS.map(srv => (
                        <TouchableOpacity key={srv} style={styles.dropdownItem} onPress={() => { setServicio(srv); setShowServiceDrop(false); }}>
                            <Text style={styles.dropdownItemText}>{srv}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            {/* 6. NOTAS */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>6. Notas Adicionales (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ej: Corte cachorro, usar champú especial..."
                placeholderTextColor="#CCC"
                multiline={true}
                numberOfLines={3}
                value={notas}
                onChangeText={setNotas}
                textAlignVertical="top"
              />
            </View>

            {/* Botones */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                  <Text style={styles.textCancel}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                  {loading ? (
                      <ActivityIndicator color={COLORES.textoSobrePrincipal} />
                  ) : (
                      <Text style={styles.textSave}>Agendar Cita</Text>
                  )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: {
    width: width * 0.9, maxHeight: height * 0.9, backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, overflow: 'hidden'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  subTitleHeader: { fontSize: 14, color: COLORES.textoSecundario, marginBottom: 20 },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 20 },
  
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  
  label: { fontSize: 13, color: COLORES.textoSecundario, marginBottom: 6, fontWeight: '600' },
  
  dropdownButton: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E0E0E0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50,
  },
  dropdownActive: {
    borderColor: COLORES.principal,
    backgroundColor: '#F0F9F0' // Un verde muy clarito cuando está abierto
  },
  inputText: { fontSize: 14, color: COLORES.texto, flex: 1 },
  
  // ESTILO ACORDEÓN
  accordionContent: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EEE',
    overflow: 'hidden' // Importante para bordes redondeados
  },
  dropdownItem: { 
    paddingVertical: 14, 
    paddingHorizontal: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F5F5F5' 
  },
  dropdownItemText: { fontSize: 14, color: COLORES.texto },

  // Estilos especiales para la grilla de Horas
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between'
  },
  timeChip: {
    width: '30%', // 3 columnas
    paddingVertical: 10,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  timeChipActive: {
    backgroundColor: COLORES.principal,
    borderColor: COLORES.principal
  },
  timeChipText: {
    fontSize: 13,
    color: COLORES.texto,
    fontWeight: '500'
  },
  
  input: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 12, fontSize: 14, color: COLORES.texto,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  textArea: { height: 80 },
  
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  btnCancel: { backgroundColor: '#EEE', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { color: COLORES.texto, fontWeight: 'bold', fontSize: 15 },
  btnSave: {
    backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 3,
  },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },
});