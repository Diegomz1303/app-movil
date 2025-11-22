import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions, FlatList,
  TextInput, Alert, Animated, KeyboardAvoidingView, Platform, ActivityIndicator
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

type Producto = { id: number; nombre: string; precio: number; stock: number; };
type CartItem = Producto & { cantidad: number };

export default function POSModal({ visible, onClose, onSaleComplete }: POSModalProps) {
  const { theme, isDark } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Producto[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [metodoPago, setMetodoPago] = useState('Yape');

  useEffect(() => {
    if (visible) {
      fetchProducts();
      setCart([]);
      setSearch('');
      scaleValue.setValue(0);
      Animated.spring(scaleValue, { toValue: 1, friction: 7, tension: 40, useNativeDriver: true }).start();
    }
  }, [visible]);

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

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const detalles = cart.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
    }));

    const { error } = await supabase.rpc('registrar_venta', {
        p_total: calcularTotal(),
        p_metodo_pago: metodoPago,
        p_cliente_id: null,
        p_user_id: user.id,
        p_detalles: detalles
    });

    setLoading(false);

    if (error) {
        Alert.alert("Error", error.message);
    } else {
        Alert.alert("Venta Exitosa", `Cobrado: S/. ${calcularTotal().toFixed(2)}`);
        onSaleComplete();
        onClose();
    }
  };

  const ProductItem = ({ item }: { item: Producto }) => (
    <TouchableOpacity 
        style={[styles.productCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]} 
        onPress={() => addToCart(item)}
    >
        <View>
            <Text style={[styles.prodName, { color: theme.text }]}>{item.nombre}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Stock: {item.stock}</Text>
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

                <View style={{ height: 150, marginBottom: 10 }}>
                    <Text style={{color: theme.textSecondary, fontSize: 12, marginBottom: 5}}>Catálogo</Text>
                    <FlatList 
                        data={products}
                        keyExtractor={item => item.id.toString()}
                        renderItem={({item}) => <ProductItem item={item} />}
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <Text style={{color: theme.textSecondary, fontSize: 12, marginVertical: 5}}>Carrito de Compras</Text>
                <FlatList 
                    data={cart}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => <CartItemRender item={item} />}
                    ListEmptyComponent={<Text style={{textAlign:'center', color: theme.textSecondary, marginTop: 20}}>Carrito vacío</Text>}
                />

                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    <View style={styles.totalRow}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total:</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>S/. {calcularTotal().toFixed(2)}</Text>
                    </View>
                    
                    <View style={styles.paymentMethods}>
                        {['Yape', 'Efectivo', 'Tarjeta'].map(m => (
                            <TouchableOpacity 
                                key={m} 
                                style={[styles.payChip, metodoPago === m ? { backgroundColor: theme.primary } : { backgroundColor: theme.inputBackground }]}
                                onPress={() => setMetodoPago(m)}
                            >
                                <Text style={{color: metodoPago === m ? 'white' : theme.text, fontSize: 12}}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity 
                        style={[styles.checkoutBtn, { backgroundColor: cart.length === 0 ? COLORES.inactivo : COLORES.verdeBoton }]}
                        disabled={cart.length === 0 || loading}
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
  modalView: { width: width * 0.95, height: height * 0.9, borderRadius: 20, padding: 20, shadowColor: '#000', shadowOpacity: 0.3, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 10 },
  productCard: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 8, alignItems: 'center' },
  prodName: { fontWeight: 'bold', fontSize: 14 },
  prodPrice: { fontWeight: 'bold' },
  divider: { height: 1, width: '100%', marginVertical: 5 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  footer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  totalLabel: { fontSize: 16 },
  totalValue: { fontSize: 24, fontWeight: 'bold' },
  paymentMethods: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  payChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  checkoutBtn: { padding: 15, borderRadius: 12, alignItems: 'center' },
  checkoutText: { color: 'white', fontWeight: 'bold', fontSize: 18, letterSpacing: 1 }
});