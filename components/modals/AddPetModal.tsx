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
  Dimensions,
  Image,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

// Librerías de Imagen
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

const { width, height } = Dimensions.get('window');

interface AddPetModalProps {
  visible: boolean;
  onClose: () => void;
  clientId: number | undefined;
  onPetAdded?: () => void;
}

export default function AddPetModal({ visible, onClose, clientId, onPetAdded }: AddPetModalProps) {
  // Animación para el modal principal
  const scaleValue = useRef(new Animated.Value(0)).current;
  
  // Animación para el selector de fotos (Menú nuevo)
  const optionsScaleValue = useRef(new Animated.Value(0)).current;

  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [nombre, setNombre] = useState('');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Fecha
  const [date, setDate] = useState(new Date()); 
  const [fechaNacimientoText, setFechaNacimientoText] = useState(''); 
  const [showDatePicker, setShowDatePicker] = useState(false); 

  // Dropdown y Selector de Imagen
  const [showSexDropdown, setShowSexDropdown] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false); // Nuevo estado para el menú de fotos

  // Estado para la foto
  const [imageUri, setImageUri] = useState<string | null>(null);

  // 1. Animación de entrada del Modal Principal
  useEffect(() => {
    if (visible) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,   // Menor fricción = más rebote
        tension: 50,   // Tensión del resorte
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // 2. Animación de entrada del Menú de Fotos (Cuando se activa)
  useEffect(() => {
    if (showImageOptions) {
      optionsScaleValue.setValue(0);
      Animated.spring(optionsScaleValue, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [showImageOptions]);

  // --- LÓGICA DE IMAGEN (Sin cambios funcionales, solo UI) ---
  
  const handleOpenImagePicker = () => {
    setShowImageOptions(true); // En lugar de Alert, abrimos nuestro menú personalizado
  };

  const handleCloseImagePicker = () => {
    setShowImageOptions(false);
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    // Cerramos el menú de opciones antes de proceder
    handleCloseImagePicker();

    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], // Actualizado para nuevas versiones de Expo
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, 
      };

      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permiso denegado", "Necesitamos acceso a la galería.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        // Compresión
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }], 
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImageUri(manipResult.uri);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo cargar la imagen.");
    }
  };

  // Subida a Supabase
  const uploadImageToSupabase = async (uri: string) => {
    try {
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${Date.now()}.${ext}`;
      const formData = new FormData();

      formData.append('file', {
        uri: uri,
        name: fileName,
        type: `image/${ext}`,
      } as any);

      const { data, error } = await supabase.storage
        .from('mascotas') 
        .upload(fileName, formData);

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('mascotas')
        .getPublicUrl(fileName);

      return publicUrlData.publicUrl;
    } catch (error) {
      console.log("Error subiendo imagen:", error);
      return null;
    }
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      const dia = selectedDate.getDate().toString().padStart(2, '0');
      const mes = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const anio = selectedDate.getFullYear();
      setFechaNacimientoText(`${dia}/${mes}/${anio}`);
    }
  };

  const handleSave = async () => {
    if (!clientId) {
        Alert.alert("Error", "No se ha identificado al cliente.");
        return;
    }
    if (!nombre || !raza) {
      Alert.alert("Campos requeridos", "El nombre y la raza son obligatorios.");
      return;
    }

    setLoading(true);
    let uploadedPhotoUrl = null;

    if (imageUri) {
        uploadedPhotoUrl = await uploadImageToSupabase(imageUri);
        if (!uploadedPhotoUrl) {
            Alert.alert("Advertencia", "La imagen no se pudo subir, se guardará sin foto.");
        }
    }

    const { error } = await supabase.from('mascotas').insert({
      nombre,
      raza,
      sexo,
      fecha_nacimiento: fechaNacimientoText,
      observaciones,
      cliente_id: clientId,
      foto_url: uploadedPhotoUrl 
    });

    setLoading(false);

    if (error) {
      Alert.alert("Error al guardar", error.message);
    } else {
      Alert.alert("¡Éxito!", "Mascota registrada correctamente.");
      if (onPetAdded) onPetAdded();
      limpiarYcerrar();
    }
  };

  const limpiarYcerrar = () => {
    setNombre('');
    setRaza('');
    setSexo('');
    setFechaNacimientoText('');
    setDate(new Date());
    setObservaciones('');
    setImageUri(null);
    setShowSexDropdown(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.centeredView}
      >
        {/* Overlay para cerrar al tocar fuera */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Registrar Mascota</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* FOTO con selector personalizado */}
            <View style={styles.uploadContainer}>
                <TouchableOpacity onPress={handleOpenImagePicker} style={styles.imageWrapper} activeOpacity={0.8}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.uploadIconBg}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={32} color={COLORES.principal} />
                        </View>
                    )}
                    {imageUri && (
                        <View style={styles.editBadge}>
                            <MaterialCommunityIcons name="pencil" size={14} color="white" />
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={styles.uploadText}>
                    {imageUri ? "Cambiar foto" : "Añadir foto"}
                </Text>
            </View>

            {/* Formulario */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Nombre *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={nombre} 
                        onChangeText={setNombre} 
                        placeholder="Ej. Firulais"
                        placeholderTextColor="#CCC"
                    />
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Raza *</Text>
                    <TextInput 
                        style={styles.input} 
                        value={raza} 
                        onChangeText={setRaza} 
                        placeholder="Ej. Mestizo"
                        placeholderTextColor="#CCC"
                    />
                </View>
            </View>

            <View style={[styles.row, { zIndex: 10 }]}> 
                {/* Dropdown Sexo */}
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Sexo</Text>
                    <TouchableOpacity 
                        style={styles.dropdownButton} 
                        onPress={() => setShowSexDropdown(!showSexDropdown)}
                    >
                        <Text style={{ color: sexo ? COLORES.texto : '#999', fontSize: 14 }}>
                            {sexo || 'Seleccionar'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={COLORES.texto} />
                    </TouchableOpacity>
                    
                    {showSexDropdown && (
                        <View style={styles.dropdownList}>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSexo('Macho'); setShowSexDropdown(false); }}>
                                <Text style={styles.dropdownItemText}>Macho</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSexo('Hembra'); setShowSexDropdown(false); }}>
                                <Text style={styles.dropdownItemText}>Hembra</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Selector de Fecha */}
                <View style={styles.halfInput}>
                    <Text style={styles.label}>Nacimiento</Text>
                    <TouchableOpacity 
                        style={styles.dateContainer}
                        onPress={() => setShowDatePicker(true)} 
                        activeOpacity={0.7}
                    >
                        <Text style={{ 
                            fontSize: 14, 
                            color: fechaNacimientoText ? COLORES.texto : '#CCC',
                            flex: 1 
                        }}>
                            {fechaNacimientoText || 'dd/mm/aaaa'}
                        </Text>
                        <MaterialCommunityIcons name="calendar" size={18} color={COLORES.textoSecundario} />
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onChangeDate}
                            maximumDate={new Date()} 
                        />
                    )}
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Alergias, carácter..."
                    placeholderTextColor="#CCC"
                    multiline={true}
                    numberOfLines={3}
                    value={observaciones}
                    onChangeText={setObservaciones}
                    textAlignVertical="top"
                />
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

          {/* --- MENÚ OVERLAY DE SELECCIÓN DE FOTO (MODERNO) --- */}
          {showImageOptions && (
            <View style={styles.optionsOverlay}>
              <TouchableWithoutFeedback onPress={handleCloseImagePicker}>
                 <View style={styles.optionsBackdrop} />
              </TouchableWithoutFeedback>
              
              <Animated.View style={[styles.optionsContainer, { transform: [{ scale: optionsScaleValue }] }]}>
                <Text style={styles.optionsTitle}>Añadir Foto de Mascota</Text>
                <Text style={styles.optionsSubtitle}>Elige una opción</Text>

                {/* Opción Cámara */}
                <TouchableOpacity style={[styles.optionCard, { backgroundColor: COLORES.principal }]} onPress={() => pickImage('camera')}>
                   <View style={styles.optionIconCircle}>
                      <MaterialCommunityIcons name="camera" size={24} color={COLORES.principal} />
                   </View>
                   <Text style={styles.optionText}>TOMAR FOTO</Text>
                </TouchableOpacity>

                {/* Opción Galería */}
                <TouchableOpacity style={[styles.optionCard, { backgroundColor: COLORES.principalDark, marginTop: 12 }]} onPress={() => pickImage('gallery')}>
                   <View style={styles.optionIconCircle}>
                      <MaterialCommunityIcons name="image-multiple" size={24} color={COLORES.principalDark} />
                   </View>
                   <Text style={styles.optionText}>ELEGIR DE GALERÍA</Text>
                </TouchableOpacity>

                {/* Cancelar */}
                <TouchableOpacity style={styles.optionCancel} onPress={handleCloseImagePicker}>
                   <Text style={styles.optionCancelText}>Cancelar</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          )}

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute', width: '100%', height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.6)', 
  },
  modalView: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 15,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F5F5F5',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 10 },
  
  // --- Estilos FOTO ---
  uploadContainer: { alignItems: 'center', marginBottom: 20 },
  imageWrapper: { 
    position: 'relative', marginBottom: 8,
    shadowColor: COLORES.principal, shadowOffset: {width:0, height:4}, shadowOpacity:0.2, shadowRadius:5, elevation:5
  },
  uploadIconBg: { 
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FAFAFA', 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORES.principal, borderStyle: 'dashed'
  },
  previewImage: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORES.principal
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORES.principal,
    width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white'
  },
  uploadText: { color: COLORES.principal, fontWeight: '600', fontSize: 14, marginTop: 5 },

  // --- Inputs ---
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, color: COLORES.textoSecundario, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: COLORES.fondoGris, borderRadius: 12, padding: 12, fontSize: 14, color: COLORES.texto,
    borderWidth: 1, borderColor: '#EEE',
  },
  textArea: { height: 80 },
  dropdownButton: {
    backgroundColor: COLORES.fondoGris, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#EEE',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48,
  },
  dropdownList: {
    position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, zIndex: 1000,
  },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 14, color: COLORES.texto },
  dateContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORES.fondoGris, borderRadius: 12, paddingHorizontal: 12, 
    borderWidth: 1, borderColor: '#EEE', height: 48
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { color: COLORES.textoSecundario, fontWeight: 'bold', fontSize: 15 },
  btnSave: {
    backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },

  // --- NUEVOS ESTILOS: Menú de Opciones de Imagen (Overlay) ---
  optionsOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    zIndex: 20, elevation: 20,
  },
  optionsBackdrop: {
    position: 'absolute', width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.8)', // Fondo blanco semitransparente para desenfoque
  },
  optionsContainer: {
    width: '85%', backgroundColor: 'white', borderRadius: 25, padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    alignItems: 'center'
  },
  optionsTitle: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto, marginBottom: 5 },
  optionsSubtitle: { fontSize: 14, color: COLORES.textoSecundario, marginBottom: 20 },
  
  optionCard: {
    width: '100%', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5
  },
  optionIconCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  optionText: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  
  optionCancel: { marginTop: 20, padding: 10 },
  optionCancelText: { color: COLORES.textoSecundario, fontWeight: '600', fontSize: 15 }
});