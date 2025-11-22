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
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

type SimpleClient = { id: number; nombres: string; apellidos: string };
type SimplePet = { id: number; nombre: string };

interface AddAppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onAppointmentAdded?: () => void;
}

// LISTA EXACTA SEGÚN TU IMAGEN DE REFERENCIA
const SERVICIOS = [
  'BAÑO',
  'BAÑO Y CORTE',
  'SERVICIO DE COLORIMETRÍA',
  'CORTE DE UÑAS',
  'DESPARASITACIÓN'
];

const HORARIOS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
];

export default function AddAppointmentModal({ visible, onClose, onAppointmentAdded }: AddAppointmentModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const { theme, isDark } = useTheme();

  const [clientsList, setClientsList] = useState<SimpleClient[]>([]);
  const [petsList, setPetsList] = useState<SimplePet[]>([]);

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

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
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
    setShowClientDrop(false);
    setShowPetDrop(false);
    setShowTimeDrop(false);
    setShowServiceDrop(false);
  };

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

  const inputStyle = [
    styles.dropdownButton, 
    { backgroundColor: theme.inputBackground, borderColor: theme.border }
  ];

  const dropdownContainerStyle = [
    styles.accordionContent,
    { backgroundColor: theme.card, borderColor: theme.border }
  ];

  const textColor = { color: theme.text };
  const placeholderColor = theme.textSecondary;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <View style={styles.header}>
            <Text style={[styles.modalTitle, textColor]}>Agendar Servicio</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.subTitleHeader, { color: theme.textSecondary }]}>Agenda un nuevo servicio de estética</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>1. Cliente *</Text>
              <TouchableOpacity 
                style={[inputStyle, showClientDrop && { borderColor: theme.primary }]} 
                onPress={() => toggleDropdown('client')}
              >
                <Text style={[styles.inputText, { color: clientNameDisplay ? theme.text : placeholderColor }]}>
                    {clientNameDisplay || 'Selecciona un cliente...'}
                </Text>
                <MaterialCommunityIcons name={showClientDrop ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
              </TouchableOpacity>
              
              {showClientDrop && (
                <View style={dropdownContainerStyle}>
                    {clientsList.map(client => (
                      <TouchableOpacity key={client.id} style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={() => handleClientSelect(client)}>
                        <Text style={[styles.dropdownItemText, textColor]}>{client.nombres} {client.apellidos}</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>2. Mascota *</Text>
              <TouchableOpacity 
                style={[inputStyle, showPetDrop && { borderColor: theme.primary }, !selectedClientId && { opacity: 0.6 }]} 
                onPress={() => { if(selectedClientId) toggleDropdown('pet'); else Alert.alert("Aviso", "Primero selecciona un cliente"); }}
              >
                <Text style={[styles.inputText, { color: petNameDisplay ? theme.text : placeholderColor }]}>
                    {petNameDisplay || 'Selecciona una mascota...'}
                </Text>
                <MaterialCommunityIcons name={showPetDrop ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
              </TouchableOpacity>

              {showPetDrop && (
                <View style={dropdownContainerStyle}>
                   {petsList.length > 0 ? petsList.map(pet => (
                      <TouchableOpacity key={pet.id} style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={() => { setSelectedPetId(pet.id); setPetNameDisplay(pet.nombre); setShowPetDrop(false); }}>
                        <Text style={[styles.dropdownItemText, textColor]}>{pet.nombre}</Text>
                      </TouchableOpacity>
                   )) : (
                       <Text style={{ padding: 12, color: theme.textSecondary, fontStyle: 'italic' }}>Este cliente no tiene mascotas registradas.</Text>
                   )}
                </View>
              )}
            </View>

            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>3. Fecha *</Text>
                    <TouchableOpacity style={inputStyle} onPress={() => setShowDatePicker(true)}>
                        <Text style={[styles.inputText, { color: fechaText ? theme.text : placeholderColor }]}>
                            {fechaText || 'dd/mm/aaaa'}
                        </Text>
                        <MaterialCommunityIcons name="calendar" size={20} color={theme.text} />
                    </TouchableOpacity>
                    {showDatePicker && (
                        <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} minimumDate={new Date()} />
                    )}
                </View>

                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>4. Hora *</Text>
                    <TouchableOpacity 
                        style={[inputStyle, showTimeDrop && { borderColor: theme.primary }]} 
                        onPress={() => toggleDropdown('time')}
                    >
                         <Text style={[styles.inputText, { color: hora ? theme.text : placeholderColor }]}>
                            {hora || 'Hora...'}
                        </Text>
                        <MaterialCommunityIcons name={showTimeDrop ? "clock" : "clock-outline"} size={20} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>
            
            {showTimeDrop && (
                <View style={[dropdownContainerStyle, { marginTop: -10, marginBottom: 15 }]}>
                    <View style={styles.gridContainer}>
                        {HORARIOS.map(h => (
                            <TouchableOpacity 
                                key={h} 
                                style={[
                                    styles.timeChip, 
                                    { backgroundColor: theme.inputBackground, borderColor: theme.border },
                                    hora === h && { backgroundColor: theme.primary, borderColor: theme.primary }
                                ]} 
                                onPress={() => { setHora(h); setShowTimeDrop(false); }}
                            >
                                <Text style={[styles.timeChipText, { color: theme.text }, hora === h && { color: 'white' }]}>{h}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>5. Servicio *</Text>
              <TouchableOpacity 
                style={[inputStyle, showServiceDrop && { borderColor: theme.primary }]} 
                onPress={() => toggleDropdown('service')}
              >
                <Text style={[styles.inputText, { color: servicio ? theme.text : placeholderColor }]}>
                    {servicio || 'Selecciona un servicio...'}
                </Text>
                <MaterialCommunityIcons name={showServiceDrop ? "chevron-up" : "chevron-down"} size={20} color={theme.text} />
              </TouchableOpacity>
              
              {showServiceDrop && (
                <View style={dropdownContainerStyle}>
                    {SERVICIOS.map(srv => (
                        <TouchableOpacity key={srv} style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={() => { setServicio(srv); setShowServiceDrop(false); }}>
                            <Text style={[styles.dropdownItemText, textColor]}>{srv}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>6. Notas / Pedidos Especiales</Text>
              <TextInput
                style={[inputStyle, styles.textArea, { color: theme.text }]}
                placeholder="Ej: Poner lazo rojo, perfume de vainilla..."
                placeholderTextColor={placeholderColor}
                multiline={true}
                numberOfLines={3}
                value={notas}
                onChangeText={setNotas}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.footer}>
              <TouchableOpacity style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} onPress={onClose}>
                  <Text style={[styles.textCancel, { color: theme.text }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                  {loading ? <ActivityIndicator color={COLORES.textoSobrePrincipal} /> : <Text style={styles.textSave}>Agendar</Text>}
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
    width: width * 0.9, maxHeight: height * 0.9,
    borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, overflow: 'hidden'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  subTitleHeader: { fontSize: 14, marginBottom: 20 },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 20 },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  dropdownButton: {
    borderRadius: 10, padding: 12, borderWidth: 1,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50,
  },
  inputText: { fontSize: 14, flex: 1 },
  accordionContent: { borderRadius: 8, marginTop: 8, borderWidth: 1, overflow: 'hidden' },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 14 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, justifyContent: 'space-between' },
  timeChip: { width: '30%', paddingVertical: 10, marginBottom: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  timeChipText: { fontSize: 13, fontWeight: '500' },
  textArea: { height: 80 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { fontWeight: 'bold', fontSize: 15 },
  btnSave: {
    backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, elevation: 3,
  },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },
});