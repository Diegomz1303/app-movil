import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList,
  TextInput, Alert, Animated, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface POSModalProps {
  visible: boolean;
  onClose: () => void;
  onSaleComplete: () => void;
}

type Producto = { id: number; nombre: string; precio: number; stock: number; foto_url?: string };
type CartItem = Producto & { cantidad: number };

type PaymentMethodState = {
  method: string;
  amount: string;
};

export default function POSModal({ visible, onClose, onSaleComplete }: POSModalProps) {
  const { theme, isDark } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const [pagos, setPagos] = useState<PaymentMethodState[]>([]);

  const AVAILABLE_METHODS = ['Yape', 'Plin', 'Efectivo', 'Tarjeta', 'Transferencia'];

  useEffect(() => {
    if (visible) {
      fetchProducts();
      setCart([]);
      setPagos([{ method: 'Efectivo', amount: '' }]); // Por defecto efectivo
      setSearch('');
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (cart.length > 0 && pagos.length === 1) {
        setPagos([{ method: pagos[0].method, amount: calcularTotal().toFixed(2) }]);
    }
  }, [cart]);

  const fetchProducts = async (query = '') => {
    let dbQuery = supabase.from('productos').select('*').order('nombre');
    if (query) dbQuery = dbQuery.ilike('nombre', `%${query}%`);
    const { data } = await dbQuery;
    if (data) setProducts(data);
  };

  const addToCart = (product: Producto) => {
    if (product.stock <= 0) {
        Alert.alert("Sin stock", "No quedan unidades.");
        return;
    }
    setCart(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        if (exists.cantidad >= product.stock) {
            Alert.alert("Stock límite", "No puedes agregar más.");
            return prev;
        }
        return prev.map(p => p.id === product.id ? { ...p, cantidad: p.cantidad + 1 } : p);
      }
      return [...prev, { ...product, cantidad: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const changeQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
        if (item.id === id) {
            const newQty = item.cantidad + delta;
            if (newQty > item.stock) return item;
            if (newQty < 1) return item; 
            return { ...item, cantidad: newQty };
        }
        return item;
    }));
  };

  const calcularTotal = () => cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const togglePaymentMethod = (method: string) => {
    const totalVenta = calcularTotal();
    const exists = pagos.find(p => p.method === method);

    if (exists) {
        if (pagos.length === 1) return;
        setPagos(prev => prev.filter(p => p.method !== method));
    } else {
        const pagadoHastaAhora = pagos.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const restante = Math.max(0, totalVenta - pagadoHastaAhora);
        setPagos(prev => [...prev, { method, amount: restante.toFixed(2) }]);
    }
  };

  const updatePaymentAmount = (method: string, text: string) => {
    if (text !== '' && !/^\d*\.?\d*$/.test(text)) return;
    setPagos(prev => prev.map(p => 
        p.method === method ? { ...p, amount: text } : p
    ));
  };

  const getMontoRestante = () => {
      const total = calcularTotal();
      const pagado = pagos.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      return total - pagado;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const totalVenta = calcularTotal();
    const totalPagado = pagos.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    if (Math.abs(totalVenta - totalPagado) > 0.01) {
        Alert.alert("Montos incorrectos", "La suma de pagos debe ser igual al total de la venta.");
        return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const detalles = cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
    }));

    const metodoPagoString = pagos
        .map(p => `${p.method} (${parseFloat(p.amount || '0').toFixed(2)})`)
        .join(', ');

    const { error } = await supabase.rpc('registrar_venta', {
        p_total: totalVenta,
        p_metodo_pago: metodoPagoString,
        p_cliente_id: null,
        p_user_id: user.id,
        p_detalles: detalles
    });

    setLoading(false);

    if (error) {
        Alert.alert("Error", error.message);
    } else {
        Alert.alert("Venta Exitosa", `Cobrado: S/. ${totalVenta.toFixed(2)}`);
        onSaleComplete();
        onClose();
    }
  };

  const ProductItem = ({ item }: { item: Producto }) => (
    <TouchableOpacity 
        style={[styles.productCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} 
        onPress={() => addToCart(item)}
    >
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
            {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={styles.miniThumb} />
            ) : (
                <View style={[styles.miniThumb, {backgroundColor: '#EEE', justifyContent:'center', alignItems:'center'}]}>
                    <MaterialCommunityIcons name="package-variant" size={16} color="#999" />
                </View>
            )}
            <View>
                <Text style={[styles.prodName, { color: theme.text }]}>{item.nombre}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Stock: {item.stock}</Text>
            </View>
        </View>
        <Text style={[styles.prodPrice, { color: theme.primary }]}>S/. {item.precio}</Text>
    </TouchableOpacity>
  );

  const CartItemRender = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { borderBottomColor: theme.border }]}>
        <View style={{flex: 1}}>
            <Text style={{color: theme.text, fontWeight: 'bold'}} numberOfLines={1}>{item.nombre}</Text>
            <Text style={{color: theme.textSecondary}}>S/. {item.precio} c/u</Text>
        </View>
        <View style={styles.qtyControl}>
            <TouchableOpacity onPress={() => changeQty(item.id, -1)} style={[styles.qtyBtn, {backgroundColor: theme.border}]}>
                <Text style={{color: theme.text}}>-</Text>
            </TouchableOpacity>
            <Text style={{marginHorizontal: 8, color: theme.text}}>{item.cantidad}</Text>
            <TouchableOpacity onPress={() => changeQty(item.id, 1)} style={[styles.qtyBtn, {backgroundColor: theme.border}]}>
                <Text style={{color: theme.text}}>+</Text>
            </TouchableOpacity>
        </View>
        <Text style={{fontWeight: 'bold', width: 60, textAlign:'right', color: theme.text}}>
            {(item.precio * item.cantidad).toFixed(2)}
        </Text>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{marginLeft: 10}}>
            <MaterialCommunityIcons name="delete" size={20} color={theme.danger} />
        </TouchableOpacity>
    </View>
  );

  const restante = getMontoRestante();
  const isTotalOk = Math.abs(restante) < 0.01;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <View style={styles.overlay} />
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
            
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Caja Registradora</Text>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={{flex: 1, flexDirection: 'column'}}>
                
                <View style={{ maxHeight: '40%' }}>
                    <View style={[styles.searchBar, { backgroundColor: theme.inputBackground }]}>
                        <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} />
                        <TextInput 
                            style={{flex: 1, marginLeft: 8, color: theme.text}} 
                            placeholder="Buscar producto..." 
                            placeholderTextColor={theme.textSecondary}
                            value={search}
                            onChangeText={(t) => { setSearch(t); fetchProducts(t); }}
                        />
                    </View>

                    <Text style={{color: theme.textSecondary, fontSize: 12, marginBottom: 5}}>Catálogo</Text>
                    <FlatList 
                        data={products}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({item}) => <ProductItem item={item} />}
                        showsVerticalScrollIndicator={false}
                        style={{marginBottom: 10}}
                    />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={{ flex: 1 }}>
                    <Text style={{color: theme.textSecondary, fontSize: 12, marginVertical: 5}}>Carrito de Compras</Text>
                    <FlatList 
                        data={cart}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({item}) => <CartItemRender item={item} />}
                        ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>Carrito vacío</Text>}
                    />
                </View>

                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total a Pagar:</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>S/. {calcularTotal().toFixed(2)}</Text>
                    </View>
                    
                    <Text style={{color: theme.textSecondary, fontSize: 12, marginBottom: 5}}>Seleccionar Métodos de Pago:</Text>
                    <View style={styles.paymentMethods}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {AVAILABLE_METHODS.map(m => {
                                const isSelected = pagos.some(p => p.method === m);
                                return (
                                    <TouchableOpacity 
                                        key={m} 
                                        style={[
                                            styles.payChip, 
                                            isSelected ? { backgroundColor: theme.primary } : { backgroundColor: theme.inputBackground, borderWidth: 1, borderColor: theme.border }
                                        ]}
                                        onPress={() => togglePaymentMethod(m)}
                                    >
                                        <Text style={{color: isSelected ? 'white' : theme.text, fontSize: 12, fontWeight: isSelected?'bold':'normal'}}>{m}</Text>
                                        {isSelected && <MaterialCommunityIcons name="check" size={12} color="white" style={{marginLeft:4}} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    <View style={{maxHeight: 100, marginBottom: 10}}>
                        <ScrollView>
                            {pagos.map((p, index) => (
                                <View key={p.method} style={[styles.paymentInputRow, { backgroundColor: theme.inputBackground }]}>
                                    <Text style={{color: theme.text, width: 100, fontWeight:'600'}}>{p.method}</Text>
                                    <Text style={{color: theme.text, marginRight: 5}}>S/.</Text>
                                    <TextInput
                                        style={[styles.payInput, { color: theme.text, borderColor: theme.border }]}
                                        keyboardType="numeric"
                                        value={p.amount}
                                        onChangeText={(t) => updatePaymentAmount(p.method, t)}
                                        placeholder="0.00"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* INDICADOR DE VUELTO / FALTA (MODIFICADO) */}
                    {!isTotalOk && cart.length > 0 && (
                        <Text style={{
                            color: restante > 0 ? theme.danger : COLORES.principal, // Verde para vuelto (positivo)
                            textAlign:'right', 
                            marginBottom: 10, 
                            fontSize: 16, 
                            fontWeight:'bold'
                        }}>
                            {restante > 0 
                                ? `Falta cubrir: S/. ${restante.toFixed(2)}` 
                                : `Vuelto: S/. ${Math.abs(restante).toFixed(2)}`
                            }
                        </Text>
                    )}

                    <TouchableOpacity 
                        style={[styles.checkoutBtn, { backgroundColor: (cart.length === 0 || !isTotalOk) ? COLORES.inactivo : COLORES.verdeBoton }]}
                        disabled={cart.length === 0 || loading || !isTotalOk}
                        onPress={handleCheckout}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <Text style={styles.checkoutText}>COBRAR</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: { width: width * 0.95, height: height * 0.92, borderRadius: 20, padding: 15, shadowColor: '#000', shadowOpacity: 0.3, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, marginBottom: 10 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8, alignItems: 'center' },
  
  miniThumb: { width: 36, height: 36, borderRadius: 6 },

  prodName: { fontWeight: 'bold', fontSize: 14 },
  prodPrice: { fontWeight: 'bold' },
  divider: { height: 1, width: '100%', marginVertical: 5 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  
  footer: { marginTop: 5, paddingTop: 10, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  
  paymentMethods: { flexDirection: 'row', marginBottom: 10, height: 35 },
  payChip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, marginRight: 8 },
  
  paymentInputRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginBottom: 6 },
  payInput: { flex: 1, borderBottomWidth: 1, padding: 2, fontSize: 16, fontWeight: 'bold', textAlign: 'right' },

  checkoutBtn: { padding: 12, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }
});