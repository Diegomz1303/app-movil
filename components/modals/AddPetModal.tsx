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
  Image // Importamos Image para previsualizar
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
  const scaleValue = useRef(new Animated.Value(0)).current;
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

  // Dropdown
  const [showSexDropdown, setShowSexDropdown] = useState(false);

  // --- ESTADO PARA LA FOTO ---
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Animación de entrada
  useEffect(() => {
    if (visible) {
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // --- LÓGICA DE IMAGEN (Cámara y Galería) ---
  const handleSelectImage = async () => {
    Alert.alert(
      "Foto de la Mascota",
      "Elige una opción",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tomar Foto", onPress: () => pickImage('camera') },
        { text: "Abrir Galería", onPress: () => pickImage('gallery') },
      ]
    );
  };

  const pickImage = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'], // Solo imágenes (corregido)
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Calidad inicial (la comprimiremos después)
      };

      if (mode === 'camera') {
        // Pedir permiso de cámara
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permiso denegado", "Necesitamos acceso a la cámara.");
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        // Pedir permiso de galería
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert("Permiso denegado", "Necesitamos acceso a la galería.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        // --- AQUÍ OCURRE LA MAGIA DE LA COMPRESIÓN ---
        // Redimensionamos a 800px de ancho y comprimimos al 50%
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

  // Función para subir la imagen a Supabase Storage
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
        .from('mascotas') // Nombre del bucket que creamos en el SQL
        .upload(fileName, formData);

      if (error) throw error;

      // Obtener la URL pública
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

    // 1. Si hay imagen seleccionada, la subimos primero
    if (imageUri) {
        uploadedPhotoUrl = await uploadImageToSupabase(imageUri);
        if (!uploadedPhotoUrl) {
            Alert.alert("Advertencia", "La imagen no se pudo subir, se guardará sin foto.");
        }
    }

    // 2. Guardamos los datos en la tabla (incluyendo la URL de la foto)
    const { error } = await supabase.from('mascotas').insert({
      nombre,
      raza,
      sexo,
      fecha_nacimiento: fechaNacimientoText,
      observaciones,
      cliente_id: clientId,
      foto_url: uploadedPhotoUrl // Guardamos la URL
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
    setImageUri(null); // Limpiar foto
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
            
            {/* FOTO (Actualizado para mostrar la preview) */}
            <View style={styles.uploadContainer}>
                <TouchableOpacity onPress={handleSelectImage} style={styles.imageWrapper}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.uploadIconBg}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={30} color={COLORES.principal} />
                        </View>
                    )}
                    {/* Icono pequeño de edición si ya hay foto */}
                    {imageUri && (
                        <View style={styles.editBadge}>
                            <MaterialCommunityIcons name="pencil" size={14} color="white" />
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={styles.uploadText}>
                    {imageUri ? "Cambiar foto" : "Subir foto de perfil"}
                </Text>
            </View>

            {/* Nombre y Raza */}
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

            {/* Sexo y Fecha */}
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

            {/* Observaciones */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Observaciones</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Alergias, carácter, marcas..."
                    placeholderTextColor="#CCC"
                    multiline={true}
                    numberOfLines={3}
                    value={observaciones}
                    onChangeText={setObservaciones}
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
                        <Text style={styles.textSave}>Guardar Mascota</Text>
                    )}
                </TouchableOpacity>
            </View>
            
            <View style={{ height: 20 }} />
          </ScrollView>

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
    position: 'absolute', 
    width: '100%', 
    height: '100%', 
    backgroundColor: 'rgba(0,0,0,0.8)', 
  },
  modalView: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    backgroundColor: COLORES.fondoBlanco,
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 10,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORES.texto },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 10 },
  
  // Estilos mejorados para la Foto
  uploadContainer: { alignItems: 'center', marginBottom: 20 },
  imageWrapper: { position: 'relative', marginBottom: 8 },
  uploadIconBg: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORES.fondoGris, 
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed'
  },
  previewImage: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORES.principal
  },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORES.principal,
    width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white'
  },
  uploadText: { color: COLORES.principal, fontWeight: '600', fontSize: 14 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, color: COLORES.textoSecundario, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 12, fontSize: 14, color: COLORES.texto,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  textArea: { height: 80 },
  dropdownButton: {
    backgroundColor: COLORES.fondoGris, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E0E0E0',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 46,
  },
  dropdownList: {
    position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8,
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, zIndex: 1000,
  },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemText: { fontSize: 13, color: COLORES.texto },
  dateContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORES.fondoGris, borderRadius: 10, paddingHorizontal: 12, 
    borderWidth: 1, borderColor: '#E0E0E0', height: 46
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { color: COLORES.danger, fontWeight: 'bold', fontSize: 15 },
  btnSave: {
    backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12,
    shadowColor: COLORES.principal, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3, elevation: 3,
  },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },
});