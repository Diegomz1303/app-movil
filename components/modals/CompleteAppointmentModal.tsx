import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
  Animated, Dimensions, Image, TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

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

  // Helper para el placeholder de imagen
  const ImageBox = ({ uri, label, onPress }: { uri: string | null, label: string, onPress: () => void }) => (
    <TouchableOpacity style={styles.imageBox} onPress={onPress} activeOpacity={0.7}>
      {uri ? (
        <Image source={{ uri }} style={styles.imagePreview} />
      ) : (
        <View style={styles.imagePlaceholder}>
           <MaterialCommunityIcons name="camera-plus" size={30} color="#CCC" />
           <Text style={styles.imageText}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <View style={styles.overlay} />
        
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }] }]}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.modalTitle}>Completar Cita</Text>
              <Text style={styles.modalSubtitle}>Mascota: {mascotaNombre}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={COLORES.textoSecundario} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Fila 1: Fotos Llegada y Salida */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>1. Foto Llegada (Opc.)</Text>
                    <ImageBox uri={fotoLlegada} label="Subir foto" onPress={() => pickImage('llegada')} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>2. Foto Salida (Opc.)</Text>
                    <ImageBox uri={fotoSalida} label="Subir foto" onPress={() => pickImage('salida')} />
                </View>
            </View>

            {/* Fila 2: Precio y Peso */}
            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>3. Precio (S/.) *</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ej: 50.00" 
                        keyboardType="numeric"
                        value={precio}
                        onChangeText={setPrecio}
                    />
                </View>
                <View style={styles.halfInput}>
                    <Text style={styles.label}>4. Peso (kg) (Opc.)</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Ej: 5.5" 
                        keyboardType="numeric"
                        value={peso}
                        onChangeText={setPeso}
                    />
                </View>
            </View>

            {/* Fila 3: Método de Pago y Shampoo */}
            <View style={styles.row}>
                <View style={[styles.halfInput, { zIndex: 20 }]}>
                    <Text style={styles.label}>5. Método de Pago *</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowPagoDrop(!showPagoDrop); setShowShampooDrop(false); }}>
                        <Text style={{ color: metodoPago ? COLORES.texto : '#999' }}>{metodoPago || 'Seleccionar...'}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                    {showPagoDrop && (
                        <View style={styles.dropList}>
                            {METODOS_PAGO.map(m => (
                                <TouchableOpacity key={m} style={styles.dropItem} onPress={() => { setMetodoPago(m); setShowPagoDrop(false); }}>
                                    <Text>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style={[styles.halfInput, { zIndex: 10 }]}>
                    <Text style={styles.label}>6. Shampoo (Opc.)</Text>
                    <TouchableOpacity style={styles.dropdown} onPress={() => { setShowShampooDrop(!showShampooDrop); setShowPagoDrop(false); }}>
                        <Text style={{ color: shampoo ? COLORES.texto : '#999' }}>{shampoo || 'Seleccionar...'}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                    {showShampooDrop && (
                        <View style={styles.dropList}>
                            {SHAMPOOS.map(s => (
                                <TouchableOpacity key={s} style={styles.dropItem} onPress={() => { setShampoo(s); setShowShampooDrop(false); }}>
                                    <Text>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Boleta */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>7. Boleta / Comprobante (Opcional)</Text>
                <TouchableOpacity style={[styles.imageBox, { height: 60, flexDirection: 'row', gap: 10 }]} onPress={() => pickImage('boleta')}>
                     {fotoBoleta ? (
                         <Image source={{ uri: fotoBoleta }} style={{ width: '100%', height: '100%', borderRadius: 10 }} resizeMode='cover' />
                     ) : (
                         <>
                            <MaterialCommunityIcons name="file-document-outline" size={24} color="#999" />
                            <Text style={{ color: '#999' }}>Clic para subir boleta (opcional)</Text>
                         </>
                     )}
                </TouchableOpacity>
            </View>

            {/* Observaciones */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>8. Observaciones Finales (Opcional)</Text>
                <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                    multiline 
                    placeholder="Comportamiento, notas del servicio..."
                    value={observaciones}
                    onChangeText={setObservaciones}
                />
            </View>

            {/* Botones */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
                    <Text style={styles.textCancel}>Cancelar</Text>
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
    width: width * 0.95, maxHeight: height * 0.92, backgroundColor: 'white', borderRadius: 20,
    padding: 20, shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:10
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', paddingBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: COLORES.texto },
  modalSubtitle: { fontSize: 13, color: COLORES.textoSecundario },
  scrollContent: { paddingBottom: 10 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  halfInput: { width: '48%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 5 },
  
  input: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#FAFAFA'
  },
  dropdown: {
    borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FAFAFA'
  },
  dropList: {
    position: 'absolute', top: 45, left: 0, right: 0, backgroundColor: 'white', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, zIndex: 100, elevation: 5
  },
  dropItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  
  // Estilos de Caja de Imagen
  imageBox: {
    height: 100, borderWidth: 1, borderColor: '#DDD', borderStyle: 'dashed', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA'
  },
  imagePlaceholder: { alignItems: 'center' },
  imageText: { fontSize: 10, color: '#999', marginTop: 4, textAlign: 'center' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },

  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 15, borderRadius: 8, backgroundColor: '#F0F0F0' },
  textCancel: { color: '#555', fontWeight: 'bold' },
  btnConfirm: { 
    flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: COLORES.principal, 
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center' 
  },
  textConfirm: { color: 'white', fontWeight: 'bold' }
});