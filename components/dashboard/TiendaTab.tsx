import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import AddProductModal from '../modals/AddProductModal';
import POSModal from '../modals/POSModal';

export default function TiendaTab() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPOS, setShowPOS] = useState(false);

  const fetchInventory = async () => {
    const { data } = await supabase.from('productos').select('*').order('nombre');
    if (data) setProducts(data);
  };

  useEffect(() => { fetchInventory(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory();
    setRefreshing(false);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tienda e Inventario</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Gestiona productos y ventas</Text>
      </View>

      <TouchableOpacity style={styles.posButton} onPress={() => setShowPOS(true)}>
        <MaterialCommunityIcons name="cart-plus" size={28} color="white" />
        <View>
            <Text style={styles.posTitle}>NUEVA VENTA</Text>
            <Text style={styles.posSubtitle}>Abrir Caja Registradora</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="white" />
      </TouchableOpacity>

      <View style={styles.listHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventario</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)} style={[styles.addBtn, { backgroundColor: theme.inputBackground }]}>
            <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Producto</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={[styles.iconBg, { backgroundColor: theme.inputBackground }]}>
                <MaterialCommunityIcons name="tag-outline" size={24} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.prodName, { color: theme.text }]}>{item.nombre}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.descripcion || 'Sin descripción'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.price, { color: theme.primary }]}>S/. {item.precio}</Text>
                <Text style={{ color: item.stock < 5 ? COLORES.danger : theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>Stock: {item.stock}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 50, color: theme.textSecondary }}>No hay productos registrados.</Text>
        }
      />

      <AddProductModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={fetchInventory} />
      <POSModal visible={showPOS} onClose={() => setShowPOS(false)} onSaleComplete={fetchInventory} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 50, paddingBottom: 15 },
  title: { fontSize: 26, fontWeight: 'bold' },
  subtitle: { fontSize: 14 },
  
  posButton: {
    backgroundColor: COLORES.principal, borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: COLORES.principal, shadowOffset: {width:0, height:4}, shadowOpacity:0.3, elevation:5,
    marginBottom: 20
  },
  posTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  posSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', padding: 8, borderRadius: 8, alignItems: 'center', gap: 5 },

  card: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  iconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  prodName: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 16, fontWeight: 'bold' }
});