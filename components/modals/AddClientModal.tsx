import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
  LayoutAnimation,
  UIManager
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

// Habilitar animaciones en Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export default function AddClientModal({ visible, onClose, onClientAdded }: AddClientModalProps) {
  
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowSuccess(false); 
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7, 
        tension: 40, 
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [showDropdown, setShowDropdown] = useState(false);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [distrito, setDistrito] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');
  const [loading, setLoading] = useState(false);
  
  const documentos = ['DNI', 'Carnet de Extranjería', 'Pasaporte'];

  const handleSave = async () => {
    if (!nombres || !telefono) {
      Alert.alert("Atención", "El nombre y teléfono son obligatorios.");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('Error', 'No hay sesión activa.');
      return;
    }

    const { error } = await supabase.from('clientes').insert({
      nombres,
      apellidos,
      correo,
      telefono,
      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,
      distrito,
      contacto_emergencia: contactoEmergencia,
      telefono_emergencia: telefonoEmergencia,
      user_id: user.id,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Error al guardar', error.message);
    } else {
      // Animación suave de cambio de tamaño
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShowSuccess(true);
      
      // Cierra automáticamente después de 2 segundos
      setTimeout(() => {
        limpiarFormulario();
        onClientAdded();
        onClose();
      }, 2000); 
    }
  };

  const limpiarFormulario = () => {
    setNombres('');
    setApellidos('');
    setCorreo('');
    setTelefono('');
    setNumeroDocumento('');
    setDistrito('');
    setContactoEmergencia('');
    setTelefonoEmergencia('');
    setTipoDocumento('DNI');
    setShowSuccess(false);
  };

  // --- AQUÍ ESTÁ EL CAMBIO CLAVE ---
  const renderContent = () => {
    if (showSuccess) {
      return (
        <View style={styles.successContainer}>
          {/* Usamos un Icono Nativo Gigante en lugar de Lottie para asegurar que se vea */}
          <MaterialCommunityIcons 
            name="check-circle" 
            size={100} 
            color={COLORES.principal} 
            style={{ marginBottom: 20 }}
          />
          <Text style={styles.successText}>¡Cliente Registrado!</Text>
          <Text style={styles.successSubText}>Se ha guardado correctamente.</Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <Text style={styles.modalTitle}>Registrar Cliente</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
            <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Nombres *</Text>
              <TextInput style={styles.input} value={nombres} onChangeText={setNombres} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Apellidos *</Text>
              <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo Electrónico (Opcional)</Text>
            <TextInput style={styles.input} value={correo} onChangeText={setCorreo} keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Teléfono *</Text>
            <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholder="987654321" placeholderTextColor="#CCC" />
          </View>

          <View style={[styles.row, {zIndex: 10}]}> 
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tipo de Documento</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowDropdown(!showDropdown)}>
                <Text style={styles.dropdownText} numberOfLines={1}>{tipoDocumento}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={COLORES.texto} />
              </TouchableOpacity>
              {showDropdown && (
                <View style={styles.dropdownList}>
                  {documentos.map((doc) => (
                    <TouchableOpacity key={doc} style={styles.dropdownItem} onPress={() => { setTipoDocumento(doc); setShowDropdown(false); }}>
                      <Text style={styles.dropdownItemText}>{doc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Número</Text>
              <TextInput style={styles.input} value={numeroDocumento} onChangeText={setNumeroDocumento} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Distrito *</Text>
            <TextInput style={styles.input} value={distrito} onChangeText={setDistrito} placeholder="Ica" placeholderTextColor="#CCC"/>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Contacto Emergencia</Text>
              <TextInput style={styles.input} value={contactoEmergencia} onChangeText={setContactoEmergencia} />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Teléfono Emergencia</Text>
              <TextInput style={styles.input} value={telefonoEmergencia} onChangeText={setTelefonoEmergencia} keyboardType="phone-pad" />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                <Text style={styles.textCancel}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORES.textoSobrePrincipal} />
              ) : (
                <Text style={styles.textSave}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
          <View style={{ height: 20 }} />
        </ScrollView>
      </>
    );
  };

  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          {renderContent()}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.8)', // Fondo oscuro sólido
  },
  modalView: {
    width: width * 0.9,
    // Quitamos altura fija, dejamos que se ajuste al contenido
    maxHeight: height * 0.85,
    backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10,
    overflow: 'hidden', // Para recortes limpios
  },
  // --- ESTILO DE ÉXITO (Centrado y compacto) ---
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORES.principal,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubText: {
    fontSize: 16,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  // --- Resto de estilos del formulario (Igual que antes) ---
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 10 },
  inputGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  label: { fontSize: 13, color: COLORES.textoSecundario, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 12, fontSize: 14, color: COLORES.texto,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  dropdownButton: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E0E0E0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 46,
  },
  dropdownText: { fontSize: 13, color: COLORES.texto, maxWidth: '80%' },
  dropdownList: {
    position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, zIndex: 1000,
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 13, color: COLORES.texto },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { color: COLORES.danger, fontWeight: 'bold', fontSize: 15 },
  btnSave: {
    backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },
});