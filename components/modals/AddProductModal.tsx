import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, Animated, Dimensions, Alert, Image, ScrollView, Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import LottieView from 'lottie-react-native'; 
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

const { width, height } = Dimensions.get('window');

type Producto = {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion?: string;
  foto_url?: string;
  category?: string;
  discount?: number;
  old_price?: number;
  is_new?: boolean;
  expiration_date?: string;
};

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Producto | null;
}

export default function AddProductModal({ visible, onClose, onSuccess, productToEdit }: AddProductModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const alertScale = useRef(new Animated.Value(0)).current; 

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { theme, isDark } = useTheme();

  // Estados Formulario
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [discount, setDiscount] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Efecto de entrada principal
  useEffect(() => {
    if (visible) {
      if (productToEdit) {
        setNombre(productToEdit.nombre);
        setPrecio(productToEdit.precio.toString());
        setStock(productToEdit.stock.toString());
        setDescripcion(productToEdit.descripcion || '');
        setImageUri(productToEdit.foto_url || null);
        setCategory(productToEdit.category || '');
        setDiscount(productToEdit.discount?.toString() || '');
        setOldPrice(productToEdit.old_price?.toString() || '');
        setIsNew(productToEdit.is_new || false);
        setExpirationDate(productToEdit.expiration_date ? new Date(productToEdit.expiration_date) : null);
      } else {
        limpiar();
      }
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
    }
  }, [visible, productToEdit]);

  // Efecto de rebote para la alerta de eliminación
  useEffect(() => {
    if (showDeleteConfirm) {
        alertScale.setValue(0);
        Animated.spring(alertScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
        }).start();
    }
  }, [showDeleteConfirm]);

  const limpiar = () => {
    setNombre(''); setPrecio(''); setStock(''); setDescripcion(''); setImageUri(null);
    setCategory(''); setDiscount(''); setOldPrice(''); setIsNew(false); setExpirationDate(null);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert("Permiso denegado");
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 });
      if (!result.canceled) {
        const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 500 } }], { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG });
        setImageUri(manipResult.uri);
      }
    } catch (error) { Alert.alert("Error", "No se pudo cargar la imagen."); }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) setExpirationDate(selectedDate);
  };

  const handleSave = async () => {
    if (!nombre || !precio || !stock) return Alert.alert("Faltan datos", "Nombre, precio y stock son obligatorios.");
    setLoading(true);
    
    // Lógica de guardado (simplificada para brevedad, es igual a la anterior)
    const productData = {
      nombre, precio: parseFloat(precio), stock: parseInt(stock), descripcion,
      foto_url: imageUri, category, discount: discount ? parseInt(discount) : 0,
      old_price: oldPrice ? parseFloat(oldPrice) : null, is_new: isNew,
      expiration_date: expirationDate ? expirationDate.toISOString().split('T')[0] : null
    };

    let error;
    if (productToEdit) {
        const { error: updateError } = await supabase.from('productos').update(productData).eq('id', productToEdit.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('productos').insert(productData);
        error = insertError;
    }
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else { onSuccess(); onClose(); }
  };

  const confirmDelete = () => { if (productToEdit) setShowDeleteConfirm(true); };
  
  const executeDelete = async () => {
    if (!productToEdit) return;
    setDeleting(true);
    const { error } = await supabase.from('productos').delete().eq('id', productToEdit.id);
    setDeleting(false);
    setShowDeleteConfirm(false);
    if (error) Alert.alert("Error", "No se pudo eliminar.");
    else { onSuccess(); onClose(); }
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }];
  const placeholderColor = theme.textSecondary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        
        {/* 1. Fondo Oscuro del Modal Principal */}
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        
        {/* 2. Tarjeta del Formulario */}
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>{productToEdit ? "Editar Producto" : "Nuevo Producto"}</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 20}}>
            <View style={styles.imageContainer}>
                <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    ) : (
                        <View style={[styles.uploadPlaceholder, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}>
                            <MaterialCommunityIcons name="camera-plus" size={30} color={theme.textSecondary} />
                            <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 5 }}>Foto</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Información Básica</Text>
                <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} placeholder="Nombre *" placeholderTextColor={placeholderColor} />
                
                <View style={styles.row}>
                    <TextInput style={[inputStyle, styles.halfInput]} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="Precio *" placeholderTextColor={placeholderColor} />
                    <TextInput style={[inputStyle, styles.halfInput]} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="Stock *" placeholderTextColor={placeholderColor} />
                </View>

                <TextInput style={inputStyle} value={category} onChangeText={setCategory} placeholder="Categoría" placeholderTextColor={placeholderColor} />
                
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 10 }]}>Detalles Adicionales</Text>
                <View style={styles.row}>
                    <TextInput style={[inputStyle, styles.halfInput]} value={discount} onChangeText={setDiscount} keyboardType="numeric" placeholder="% Desc." placeholderTextColor={placeholderColor} />
                    <TextInput style={[inputStyle, styles.halfInput]} value={oldPrice} onChangeText={setOldPrice} keyboardType="numeric" placeholder="Precio Ant." placeholderTextColor={placeholderColor} />
                </View>

                <TouchableOpacity style={[inputStyle, { flexDirection: 'row', alignItems: 'center', justifyContent:'space-between' }]} onPress={() => setShowDatePicker(true)}>
                    <Text style={{color: expirationDate ? theme.text : placeholderColor}}>
                        {expirationDate ? expirationDate.toLocaleDateString() : "Vencimiento (Opcional)"}
                    </Text>
                    <MaterialCommunityIcons name="calendar" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
                {showDatePicker && <DateTimePicker value={expirationDate || new Date()} mode="date" display="default" onChange={onDateChange} />}

                <View style={styles.switchContainer}>
                    <Text style={{ color: theme.text, fontWeight: '600' }}>¿Es nuevo?</Text>
                    <Switch value={isNew} onValueChange={setIsNew} trackColor={{false: '#767577', true: COLORES.principal}} thumbColor={'#f4f3f4'} />
                </View>

                <TextInput style={[inputStyle, { height: 60, marginTop: 10 }]} multiline value={descripcion} onChangeText={setDescripcion} placeholder="Descripción..." placeholderTextColor={placeholderColor} />
            </View>

            <View style={styles.footer}>
                {productToEdit && (
                    <TouchableOpacity style={styles.btnDelete} onPress={confirmDelete} disabled={loading}>
                        <MaterialCommunityIcons name="trash-can-outline" size={22} color="#D32F2F" />
                    </TouchableOpacity>
                )}
                <View style={{flex: 1}} />
                <TouchableOpacity style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} onPress={onClose}>
                    <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                    {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Guardar</Text>}
                </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>

        {/* --- 3. ALERTA DE ELIMINACIÓN (Superpuesta como capa absoluta) --- */}
        {showDeleteConfirm && (
            <View style={styles.nestedAlertOverlay}>
                <Animated.View style={[styles.alertBox, { transform: [{ scale: alertScale }], backgroundColor: theme.card }]}>
                    <View style={styles.lottieContainer}>
                        <LottieView source={require('../../assets/alert_anim.json')} autoPlay loop style={{ width: 80, height: 80 }} />
                    </View>
                    <Text style={[styles.alertTitle, { color: theme.text }]}>¿Eliminar Producto?</Text>
                    <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                        Esta acción eliminará "{productToEdit?.nombre}" permanentemente.
                    </Text>
                    <View style={styles.alertButtons}>
                        <TouchableOpacity style={[styles.alertBtnCancel, { backgroundColor: theme.inputBackground }]} onPress={() => setShowDeleteConfirm(false)}>
                            <Text style={{ color: theme.text, fontWeight: 'bold' }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.alertBtnConfirm} onPress={executeDelete} disabled={deleting}>
                            {deleting ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>Eliminar</Text>}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        )}

      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: width * 0.9, maxHeight: height * 0.9, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  imageContainer: { alignItems: 'center', marginBottom: 15 },
  imageWrapper: { shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.2, elevation:3 },
  previewImage: { width: 100, height: 100, borderRadius: 15, borderWidth: 1, borderColor: '#EEE' },
  uploadPlaceholder: { width: 100, height: 100, borderRadius: 15, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  form: { gap: 12 },
  label: { fontSize: 12, fontWeight: 'bold', marginTop: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  row: { flexDirection: 'row', gap: 10 },
  halfInput: { flex: 1 },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 10 },
  btnDelete: { padding: 12, borderRadius: 10, backgroundColor: '#FFEBEE', marginRight: 'auto' },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnSave: { backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' },

  // --- ESTILOS DE LA CAPA SUPERPUESTA (Overlay) ---
  nestedAlertOverlay: {
    position: 'absolute', // Esto es la clave: se sale del flujo y cubre todo
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)', // Fondo oscuro para tapar el formulario de atrás
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999, // Asegura que esté encima de todo
    elevation: 20 // Para Android
  },
  alertBox: { width: width * 0.8, borderRadius: 20, padding: 25, alignItems: 'center', shadowColor: "#000", shadowOffset: {width:0, height:4}, shadowOpacity:0.4, elevation:25 },
  lottieContainer: { marginBottom: 15 },
  alertTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  alertMessage: { fontSize: 14, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  alertButtons: { flexDirection: 'row', gap: 15, width: '100%' },
  alertBtnCancel: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  alertBtnConfirm: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#D32F2F' }
});