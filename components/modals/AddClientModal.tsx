import React, { useState } from 'react';
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
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  onClientAdded: () => void;
}

export default function AddClientModal({ visible, onClose, onClientAdded }: AddClientModalProps) {
  // Estados para todos los campos de la imagen
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  
  // Estado para el selector de documento
  const [tipoDocumento, setTipoDocumento] = useState('DNI');
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [distrito, setDistrito] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');
  
  const [loading, setLoading] = useState(false);

  const documentos = ['DNI', 'Carnet de Extranjería', 'Pasaporte'];

  const handleSave = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('Error', 'No hay sesión activa.');
      return;
    }

    // Enviamos los datos (todos son opcionales, no hay validación if/else)
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
      Alert.alert('¡Éxito!', 'Cliente registrado correctamente.');
      // Limpiar formulario
      setNombres('');
      setApellidos('');
      setCorreo('');
      setTelefono('');
      setNumeroDocumento('');
      setDistrito('');
      setContactoEmergencia('');
      setTelefonoEmergencia('');
      setTipoDocumento('DNI');
      
      onClientAdded();
      onClose();
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <View style={styles.modalView}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Registrar Cliente</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Nombres y Apellidos */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Nombres</Text>
                <TextInput style={styles.input} value={nombres} onChangeText={setNombres} />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput style={styles.input} value={apellidos} onChangeText={setApellidos} />
              </View>
            </View>

            {/* Correo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Correo Electrónico (Opcional)</Text>
              <TextInput 
                style={styles.input} 
                value={correo} 
                onChangeText={setCorreo} 
                keyboardType="email-address" 
                autoCapitalize="none"
              />
            </View>

            {/* Teléfono */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput 
                style={styles.input} 
                value={telefono} 
                onChangeText={setTelefono} 
                keyboardType="phone-pad" 
                placeholder="987654321"
                placeholderTextColor="#CCC"
              />
            </View>

            {/* Documento (Tipo y Número) */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Tipo de Documento</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton} 
                  onPress={() => setShowDropdown(!showDropdown)}
                >
                  <Text style={styles.dropdownText}>{tipoDocumento}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color={COLORES.texto} />
                </TouchableOpacity>
                
                {/* Menú desplegable personalizado */}
                {showDropdown && (
                  <View style={styles.dropdownList}>
                    {documentos.map((doc) => (
                      <TouchableOpacity 
                        key={doc} 
                        style={styles.dropdownItem}
                        onPress={() => {
                          setTipoDocumento(doc);
                          setShowDropdown(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{doc}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.halfInput}>
                <Text style={styles.label}>Número</Text>
                <TextInput 
                  style={styles.input} 
                  value={numeroDocumento} 
                  onChangeText={setNumeroDocumento} 
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Distrito */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Distrito</Text>
              <TextInput style={styles.input} value={distrito} onChangeText={setDistrito} placeholder="Ica" placeholderTextColor="#CCC"/>
            </View>

            {/* Emergencia */}
            <View style={styles.row}>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Contacto Emergencia</Text>
                <TextInput style={styles.input} value={contactoEmergencia} onChangeText={setContactoEmergencia} />
              </View>
              <View style={styles.halfInput}>
                <Text style={styles.label}>Teléfono Emergencia</Text>
                <TextInput 
                  style={styles.input} 
                  value={telefonoEmergencia} 
                  onChangeText={setTelefonoEmergencia} 
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Botón Guardar */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORES.textoSobrePrincipal} />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
            
            {/* Espacio extra al final */}
            <View style={{ height: 20 }} />

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: COLORES.fondoBlanco,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '85%', // Ocupa el 85% de la pantalla
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORES.texto,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    zIndex: 1, // Para que el dropdown se vea por encima
  },
  halfInput: {
    width: '48%',
  },
  label: {
    fontSize: 13,
    color: COLORES.textoSecundario,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: COLORES.fondoGris,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: COLORES.texto,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  // Estilos del Dropdown Personalizado
  dropdownButton: {
    backgroundColor: COLORES.fondoGris,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORES.principal, // Borde verde como en la imagen cuando activo
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
  },
  dropdownText: {
    fontSize: 14,
    color: COLORES.texto,
  },
  dropdownList: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: COLORES.texto,
  },
  saveButton: {
    backgroundColor: COLORES.principal,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: COLORES.textoSobrePrincipal,
    fontWeight: 'bold',
    fontSize: 16,
  },
});