import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Animated, Dimensions, Image,
  TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AddPetModalProps {
  visible: boolean;
  onClose: () => void;
  clientId: number | undefined;
  onPetAdded?: () => void;
}

export default function AddPetModal({ visible, onClose, clientId, onPetAdded }: AddPetModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const optionsScaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const { theme, isDark } = useTheme();

  // Campos Básicos
  const [nombre, setNombre] = useState('');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Campos de "Perfil de Estilo" (Grooming)
  const [estiloCorte, setEstiloCorte] = useState('');
  const [alergias, setAlergias] = useState('');
  const [comportamiento, setComportamiento] = useState('');

  const [date, setDate] = useState(new Date()); 
  const [fechaNacimientoText, setFechaNacimientoText] = useState(''); 
  const [showDatePicker, setShowDatePicker] = useState(false); 

  const [showSexDropdown, setShowSexDropdown] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      limpiarYcerrar(false); // Solo limpiar
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (showImageOptions) {
      optionsScaleValue.setValue(0);
      Animated.spring(optionsScaleValue, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    }
  }, [showImageOptions]);

  const handleOpenImagePicker = () => setShowImageOptions(true);
  const handleCloseImagePicker = () => setShowImageOptions(false);

  const pickImage = async (mode: 'camera' | 'gallery') => {
    handleCloseImagePicker();
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 1 };

      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permiso denegado");
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Permiso denegado");
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        setImageUri(manipResult.uri);
      }
    } catch (error) { Alert.alert("Error", "No se pudo cargar la imagen."); }
  };

  const uploadImageToSupabase = async (uri: string) => {
    try {
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      const fileName = `${Date.now()}.${ext}`;
      const formData = new FormData();
      formData.append('file', { uri: uri, name: fileName, type: `image/${ext}` } as any);

      const { error } = await supabase.storage.from('mascotas').upload(fileName, formData);
      if (error) throw error;
      const { data } = supabase.storage.from('mascotas').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
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
    if (!clientId) return Alert.alert("Error", "No se ha identificado al cliente.");
    if (!nombre || !raza) return Alert.alert("Campos requeridos", "El nombre y la raza son obligatorios.");

    setLoading(true);
    let uploadedPhotoUrl = null;
    if (imageUri) uploadedPhotoUrl = await uploadImageToSupabase(imageUri);

    const { error } = await supabase.from('mascotas').insert({
      nombre,
      raza,
      sexo,
      fecha_nacimiento: fechaNacimientoText,
      observaciones,
      cliente_id: clientId,
      foto_url: uploadedPhotoUrl,
      // --- NUEVOS CAMPOS DE ESTILO ---
      estilo_corte: estiloCorte,
      alergias: alergias,
      comportamiento: comportamiento
    });

    setLoading(false);

    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("¡Éxito!", "Mascota registrada correctamente.");
      if (onPetAdded) onPetAdded();
      limpiarYcerrar(true);
    }
  };

  const limpiarYcerrar = (shouldClose: boolean) => {
    setNombre(''); setRaza(''); setSexo(''); setFechaNacimientoText(''); setDate(new Date());
    setObservaciones(''); setEstiloCorte(''); setAlergias(''); setComportamiento('');
    setImageUri(null); setShowSexDropdown(false);
    if (shouldClose) onClose();
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }];
  const textColor = { color: theme.text };
  const placeholderColor = theme.textSecondary;

  return (
    <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <View style={styles.header}>
            <Text style={[styles.modalTitle, textColor]}>Registrar Mascota</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* FOTO */}
            <View style={styles.uploadContainer}>
                <TouchableOpacity onPress={handleOpenImagePicker} style={styles.imageWrapper} activeOpacity={0.8}>
                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : (
                        <View style={[styles.uploadIconBg, { borderColor: theme.primary, backgroundColor: isDark ? '#1a1a1a' : '#FAFAFA' }]}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={32} color={theme.primary} />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Formulario Básico */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Nombre *</Text>
                    <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} placeholder="Ej. Firulais" placeholderTextColor={placeholderColor} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Raza *</Text>
                    <TextInput style={inputStyle} value={raza} onChangeText={setRaza} placeholder="Ej. Mestizo" placeholderTextColor={placeholderColor} />
                </View>
            </View>

            <View style={[styles.row, { zIndex: 10 }]}> 
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Sexo</Text>
                    <TouchableOpacity style={[styles.dropdownButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} onPress={() => setShowSexDropdown(!showSexDropdown)}>
                        <Text style={{ color: sexo ? theme.text : placeholderColor, fontSize: 14 }}>{sexo || 'Seleccionar'}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.text} />
                    </TouchableOpacity>
                    {showSexDropdown && (
                        <View style={[styles.dropdownList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={() => { setSexo('Macho'); setShowSexDropdown(false); }}><Text style={[styles.dropdownItemText, textColor]}>Macho</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.dropdownItem, { borderBottomColor: theme.border }]} onPress={() => { setSexo('Hembra'); setShowSexDropdown(false); }}><Text style={[styles.dropdownItemText, textColor]}>Hembra</Text></TouchableOpacity>
                        </View>
                    )}
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Nacimiento</Text>
                    <TouchableOpacity style={[styles.dateContainer, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} onPress={() => setShowDatePicker(true)}>
                        <Text style={{ fontSize: 14, color: fechaNacimientoText ? theme.text : placeholderColor, flex: 1 }}>{fechaNacimientoText || 'dd/mm/aaaa'}</Text>
                        <MaterialCommunityIcons name="calendar" size={18} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} maximumDate={new Date()} />}
                </View>
            </View>

            {/* SECCIÓN: PERFIL DE ESTILO (Grooming Card) */}
            <Text style={[styles.sectionTitle, { color: theme.primary }]}>Perfil de Estilo (Grooming)</Text>
            
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Estilo de Corte Preferido</Text>
                <TextInput style={inputStyle} placeholder="Ej: Corte a tijera, Máquina #4, Copete alto..." placeholderTextColor={placeholderColor} value={estiloCorte} onChangeText={setEstiloCorte} />
            </View>

            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Alergias</Text>
                    <TextInput style={inputStyle} placeholder="Ej: Perfumes, Pollo" placeholderTextColor={placeholderColor} value={alergias} onChangeText={setAlergias} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Comportamiento</Text>
                    <TextInput style={inputStyle} placeholder="Ej: Nervioso al secar" placeholderTextColor={placeholderColor} value={comportamiento} onChangeText={setComportamiento} />
                </View>
            </View>

            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Observaciones Generales</Text>
                <TextInput style={[inputStyle, styles.textArea]} placeholder="Otras notas..." placeholderTextColor={placeholderColor} multiline numberOfLines={3} value={observaciones} onChangeText={setObservaciones} />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} onPress={onClose}><Text style={[styles.textCancel, { color: theme.textSecondary }]}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>{loading ? <ActivityIndicator color={COLORES.textoSobrePrincipal} /> : <Text style={styles.textSave}>Guardar</Text>}</TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>

          {showImageOptions && (
            <View style={styles.optionsOverlay}>
              <TouchableWithoutFeedback onPress={handleCloseImagePicker}><View style={[styles.optionsBackdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]} /></TouchableWithoutFeedback>
              <Animated.View style={[styles.optionsContainer, { transform: [{ scale: optionsScaleValue }], backgroundColor: theme.card }]}>
                <Text style={[styles.optionsTitle, textColor]}>Foto de Mascota</Text>
                <TouchableOpacity style={[styles.optionCard, { backgroundColor: theme.primary }]} onPress={() => pickImage('camera')}><Text style={styles.optionText}>TOMAR FOTO</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.optionCard, { backgroundColor: COLORES.principalDark, marginTop: 12 }]} onPress={() => pickImage('gallery')}><Text style={styles.optionText}>GALERÍA</Text></TouchableOpacity>
              </Animated.View>
            </View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: width * 0.9, maxHeight: height * 0.85, borderRadius: 20, padding: 25, shadowColor: '#000', shadowOpacity: 0.35, elevation: 15, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold' },
  closeIcon: { padding: 5 },
  scrollContent: { paddingBottom: 10 },
  uploadContainer: { alignItems: 'center', marginBottom: 20 },
  imageWrapper: { position: 'relative', marginBottom: 8, shadowColor: COLORES.principal, shadowOpacity: 0.2, elevation: 5 },
  uploadIconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed' },
  previewImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: COLORES.principal },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  input: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1 },
  textArea: { height: 60, textAlignVertical: 'top' },
  dropdownButton: { borderRadius: 12, padding: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48 },
  dropdownList: { position: 'absolute', top: 52, left: 0, right: 0, borderRadius: 8, borderWidth: 1, elevation: 5, zIndex: 1000 },
  dropdownItem: { padding: 12, borderBottomWidth: 1 },
  dropdownItemText: { fontSize: 14 },
  dateContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, height: 48 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  textCancel: { fontWeight: 'bold', fontSize: 15 },
  btnSave: { backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12, elevation: 5 },
  textSave: { color: COLORES.textoSobrePrincipal, fontWeight: 'bold', fontSize: 15 },
  optionsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 20, elevation: 20 },
  optionsBackdrop: { position: 'absolute', width: '100%', height: '100%' },
  optionsContainer: { width: '85%', borderRadius: 25, padding: 25, elevation: 10, alignItems: 'center' },
  optionsTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  optionCard: { width: '100%', paddingVertical: 15, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', elevation: 5 },
  optionText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});