import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
  Animated, Dimensions, Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Listas para Dropdowns
const METODOS_PAGO = ['Yape', 'Plin', 'Efectivo', 'Tarjeta', 'Transferencia'];
const SHAMPOOS = ['Normal', 'Hipoalergénico', 'Medicad', 'Blanqueador', 'Ninguno'];

interface CompleteModalProps {
  visible: boolean;
  onClose: () => void;
  citaId: number | null;
  mascotaNombre: string;
  onSuccess: () => void;
}

export default function CompleteAppointmentModal({ visible, onClose, citaId, mascotaNombre, onSuccess }: CompleteModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);

  // 2. Usamos el tema
  const { theme, isDark } = useTheme();

  // Estados del Formulario
  const [precio, setPrecio] = useState('');
  const [peso, setPeso] = useState('');
  const [observaciones, setObservaciones] = useState('');
  
  // Dropdowns
  const [metodoPago, setMetodoPago] = useState('');
  const [shampoo, setShampoo] = useState('');
  const [showPagoDrop, setShowPagoDrop] = useState(false);
  const [showShampooDrop, setShowShampooDrop] = useState(false);

  // Imágenes (URIs locales)
  const [fotoLlegada, setFotoLlegada] = useState<string | null>(null);
  const [fotoSalida, setFotoSalida] = useState<string | null>(null);
  const [fotoBoleta, setFotoBoleta] = useState<string | null>(null);

  // Animación de entrada
  useEffect(() => {
    if (visible) {
      limpiar();
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1, friction: 6, tension: 50, useNativeDriver: true
      }).start();
    }
  }, [visible]);

  const limpiar = () => {
    setPrecio(''); setPeso(''); setObservaciones('');
    setMetodoPago(''); setShampoo('');
    setFotoLlegada(null); setFotoSalida(null); setFotoBoleta(null);
    setShowPagoDrop(false); setShowShampooDrop(false);
  };

  // --- Lógica de Imágenes ---
  const pickImage = async (type: 'llegada' | 'salida' | 'boleta') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 1,
      });

      if (!result.canceled) {
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri, [{ resize: { width: 800 } }], { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        if (type === 'llegada') setFotoLlegada(manipResult.uri);
        if (type === 'salida') setFotoSalida(manipResult.uri);
        if (type === 'boleta') setFotoBoleta(manipResult.uri);
      }
    } catch (error) { Alert.alert("Error", "No se pudo cargar la imagen."); }
  };

  const uploadImage = async (uri: string, folder: string) => {
    const ext = uri.substring(uri.lastIndexOf('.') + 1);
    const fileName = `${folder}/${Date.now()}.${ext}`;
    const formData = new FormData();
    formData.append('file', { uri, name: fileName, type: `image/${ext}` } as any);

    const { error } = await supabase.storage.from('mascotas').upload(fileName, formData);
    if (error) return null;
    const { data } = supabase.storage.from('mascotas').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- Guardar ---
  const handleComplete = async () => {
    if (!precio || !metodoPago) {
      Alert.alert("Faltan datos", "El precio y el método de pago son obligatorios.");
      return;
    }

    setLoading(true);

    // Subir fotos si existen
    const urlLlegada = fotoLlegada ? await uploadImage(fotoLlegada, 'citas_llegada') : null;
    const urlSalida = fotoSalida ? await uploadImage(fotoSalida, 'citas_salida') : null;
    const urlBoleta = fotoBoleta ? await uploadImage(fotoBoleta, 'citas_boletas') : null;

    // Actualizar en DB
    const { error } = await supabase.from('citas').update({
      estado: 'completada',
      precio: parseFloat(precio),
      peso: peso ? parseFloat(peso) : null,
      metodo_pago: metodoPago,
      shampoo: shampoo,
      observaciones_finales: observaciones,
      foto_llegada: urlLlegada,
      foto_salida: urlSalida,
      foto_boleta: urlBoleta
    }).eq('id', citaId);

    setLoading(false);

    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("¡Excelente!", "Cita completada con éxito.");
      onSuccess();
      onClose();
    }
  };

  // Estilos dinámicos
  const textColor = { color: theme.text };
  const textSecondary = { color: theme.textSecondary };
  const inputBg = { backgroundColor: theme.inputBackground, borderColor: theme.border };
  const placeholderColor = theme.textSecondary;

  // Helper para el placeholder de imagen (adaptado al tema)
  const ImageBox = ({ uri, label, onPress }: { uri: string | null, label: string, onPress: () => void }) => (
    <TouchableOpacity style={[styles.imageBox, inputBg]} onPress={onPress} activeOpacity={0.7}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagePreview} />
      ) : (
        <View style={styles.imagePlaceholder}>
           <MaterialCommunityIcons name="camera-plus" size={30} color={theme.textSecondary} />
           <Text style={[styles.imageText, textSecondary]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.modalTitle, textColor]}>Completar Cita</Text>
              <Text style={[styles.modalSubtitle, textSecondary]}>Mascota: {mascotaNombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            
            {/* Fila 1: Fotos Llegada y Salida */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, textSecondary]}>1. Foto Llegada (Opc.)</Text>
                    <ImageBox uri={fotoLlegada} label="Subir foto" onPress={() => pickImage('llegada')} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, textSecondary]}>2. Foto Salida (Opc.)</Text>
                    <ImageBox uri={fotoSalida} label="Subir foto" onPress={() => pickImage('salida')} />
                </View>
            </View>

            {/* Fila 2: Precio y Peso */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, textSecondary]}>3. Precio (S/.) *</Text>
                    <TextInput 
                        style={[styles.input, inputBg, textColor]} 
                        placeholder="Ej: 50.00" 
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={precio}
                        onChangeText={setPrecio}
                    />
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, textSecondary]}>4. Peso (kg) (Opc.)</Text>
                    <TextInput 
                        style={[styles.input, inputBg, textColor]} 
                        placeholder="Ej: 5.5" 
                        placeholderTextColor={placeholderColor}
                        keyboardType="numeric"
                        value={peso}
                        onChangeText={setPeso}
                    />
                </View>
            </View>

            {/* Fila 3: Método de Pago y Shampoo */}
            <View style={styles.row}>
                <View style={[styles.halfInput, { zIndex: 20 }]}>
                    <Text style={[styles.label, textSecondary]}>5. Método de Pago *</Text>
                    <TouchableOpacity 
                        style={[styles.dropdown, inputBg]} 
                        onPress={() => { setShowPagoDrop(!showPagoDrop); setShowShampooDrop(false); }}
                    >
                        <Text style={{ color: metodoPago ? theme.text : placeholderColor }}>
                            {metodoPago || 'Seleccionar...'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {showPagoDrop && (
                        <View style={[styles.dropList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {METODOS_PAGO.map(m => (
                                <TouchableOpacity key={m} style={[styles.dropItem, { borderBottomColor: theme.border }]} onPress={() => { setMetodoPago(m); setShowPagoDrop(false); }}>
                                    <Text style={{ color: theme.text }}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={[styles.halfInput, { zIndex: 10 }]}>
                    <Text style={[styles.label, textSecondary]}>6. Shampoo (Opc.)</Text>
                    <TouchableOpacity 
                        style={[styles.dropdown, inputBg]} 
                        onPress={() => { setShowShampooDrop(!showShampooDrop); setShowPagoDrop(false); }}
                    >
                        <Text style={{ color: shampoo ? theme.text : placeholderColor }}>
                            {shampoo || 'Seleccionar...'}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    {showShampooDrop && (
                        <View style={[styles.dropList, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            {SHAMPOOS.map(s => (
                                <TouchableOpacity key={s} style={[styles.dropItem, { borderBottomColor: theme.border }]} onPress={() => { setShampoo(s); setShowShampooDrop(false); }}>
                                    <Text style={{ color: theme.text }}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Boleta */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, textSecondary]}>7. Boleta / Comprobante (Opcional)</Text>
                <TouchableOpacity 
                    style={[styles.imageBox, inputBg, { height: 60, flexDirection: 'row', gap: 10 }]} 
                    onPress={() => pickImage('boleta')}
                >
                     {fotoBoleta ? (
                         <Image source={{ uri: fotoBoleta }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode='cover' />
                     ) : (
                         <>
                            <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.textSecondary} />
                            <Text style={[textSecondary, { fontSize: 13 }]}>Clic para subir boleta (opcional)</Text>
                         </>
                     )}
                </TouchableOpacity>
            </View>

            {/* Observaciones */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, textSecondary]}>8. Observaciones Finales (Opcional)</Text>
                <TextInput 
                    style={[styles.input, inputBg, textColor, { height: 80, textAlignVertical: 'top' }]} 
                    multiline 
                    placeholder="Comportamiento, notas del servicio..."
                    placeholderTextColor={placeholderColor}
                    value={observaciones}
                    onChangeText={setObservaciones}
                />
            </View>

            {/* Botones */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} 
                    onPress={onClose}
                >
                    <Text style={[styles.textCancel, textSecondary]}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.btnConfirm} onPress={handleComplete} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : (
                         <>
                            <MaterialCommunityIcons name="check" size={18} color="white" style={{ marginRight: 5 }} />
                            <Text style={styles.textConfirm}>Confirmar y Completar</Text>
                         </>
                    )}
                </TouchableOpacity>
            </View>
            <View style={{height: 20}} />

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
    width: width * 0.95, maxHeight: height * 0.92,
    borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:10,
    overflow: 'hidden'
  },

  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    marginBottom: 15, borderBottomWidth: 1, paddingBottom: 10 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalSubtitle: { fontSize: 13, marginTop: 2 },
  scrollContent: { paddingBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  
  input: {
    borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14
  },
  dropdown: {
    borderWidth: 1, borderRadius: 8, padding: 10, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  dropList: {
    position: 'absolute', top: 45, left: 0, right: 0, 
    borderWidth: 1, borderRadius: 8, zIndex: 100, elevation: 5
  },
  dropItem: { padding: 10, borderBottomWidth: 1 },
  
  // Estilos de Caja de Imagen
  imageBox: {
    height: 100, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  imagePlaceholder: { alignItems: 'center' },
  imageText: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8 },
  textCancel: { fontWeight: 'bold' },
  btnConfirm: { 
    flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORES.principal, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center' 
  },
  textConfirm: { color: 'white', fontWeight: 'bold' }
});