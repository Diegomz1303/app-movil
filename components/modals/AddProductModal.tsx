import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, Animated, Dimensions, Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductModal({ visible, onClose, onSuccess }: AddProductModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [descripcion, setDescripcion] = useState('');

  useEffect(() => {
    if (visible) {
      limpiar();
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }).start();
    }
  }, [visible]);

  const limpiar = () => {
    setNombre(''); setPrecio(''); setStock(''); setDescripcion('');
  };

  const handleSave = async () => {
    if (!nombre || !precio || !stock) {
      Alert.alert("Faltan datos", "Nombre, precio y stock son obligatorios.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('productos').insert({
      nombre,
      precio: parseFloat(precio),
      stock: parseInt(stock),
      descripcion
    });
    setLoading(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Éxito", "Producto agregado al inventario.");
      onSuccess();
      onClose();
    }
  };

  const inputStyle = [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }];
  const placeholderColor = theme.textSecondary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Nuevo Producto</Text>
            <TouchableOpacity onPress={onClose}><MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} /></TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Nombre del Producto *</Text>
            <TextInput style={inputStyle} value={nombre} onChangeText={setNombre} placeholder="Ej. Comida Premium 1kg" placeholderTextColor={placeholderColor} />

            <View style={styles.row}>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Precio (S/.) *</Text>
                    <TextInput style={inputStyle} value={precio} onChangeText={setPrecio} keyboardType="numeric" placeholder="0.00" placeholderTextColor={placeholderColor} />
                </View>
                <View style={styles.halfInput}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Stock Inicial *</Text>
                    <TextInput style={inputStyle} value={stock} onChangeText={setStock} keyboardType="numeric" placeholder="0" placeholderTextColor={placeholderColor} />
                </View>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary }]}>Descripción (Opcional)</Text>
            <TextInput style={[inputStyle, { height: 60 }]} multiline value={descripcion} onChangeText={setDescripcion} placeholder="Detalles..." placeholderTextColor={placeholderColor} />
          </View>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.btnCancel, { backgroundColor: theme.inputBackground }]} onPress={onClose}>
                <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Guardar</Text>}
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: width * 0.9, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { gap: 15 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 25, gap: 10 },
  btnCancel: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10 },
  btnSave: { backgroundColor: COLORES.principal, paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10 },
  btnText: { color: 'white', fontWeight: 'bold' }
});