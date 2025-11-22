import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import AddProductModal from '../modals/AddProductModal';
import POSModal from '../modals/POSModal';

// --- CORRECCIÓN AQUÍ: Importación limpia y correcta ---
import Pagination from '../ui/Pagination'; 

const ITEMS_PER_PAGE = 8; 

export default function TiendaTab() {
  const { theme } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null); 
  const [showPOS, setShowPOS] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  const fetchInventory = async (page = 1) => {
    setLoading(true);
    
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    try {
      const { data, error, count } = await supabase
        .from('productos')
        .select('*', { count: 'exact' }) 
        .order('created_at', { ascending: false })
        .range(from, to); 

      if (error) {
        console.error(error);
      } else {
        setProducts(data || []);
        setTotalCount(count || 0);
        setCurrentPage(page);
        
        if (flatListRef.current) {
            flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(1); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory(1); 
    setRefreshing(false);
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchInventory(newPage);
  };

  const handleCreateProduct = () => { setSelectedProduct(null); setShowProductModal(true); };
  const handleEditProduct = (product: any) => { setSelectedProduct(product); setShowProductModal(true); };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

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
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Inventario ({totalCount})</Text>
        <TouchableOpacity onPress={handleCreateProduct} style={[styles.addBtn, { backgroundColor: theme.inputBackground }]}>
            <MaterialCommunityIcons name="plus" size={20} color={theme.primary} />
            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Producto</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
          <View style={{flex:1, justifyContent:'center'}}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <FlatList
            ref={flatListRef}
            data={products}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
            <TouchableOpacity 
                style={[styles.card, { backgroundColor: theme.card }]} 
                onPress={() => handleEditProduct(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.imageContainer, { backgroundColor: theme.inputBackground }]}>
                    {item.foto_url ? (
                        <Image source={{ uri: item.foto_url }} style={styles.productImage} />
                    ) : (
                        <MaterialCommunityIcons name="tag-outline" size={24} color={theme.primary} />
                    )}
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{flexDirection:'row', alignItems:'center', gap: 5}}>
                        <Text style={[styles.prodName, { color: theme.text }]} numberOfLines={1}>{item.nombre}</Text>
                        {item.is_new && <View style={styles.badgeNew}><Text style={styles.badgeText}>NUEVO</Text></View>}
                        {item.discount > 0 && <View style={styles.badgeDiscount}><Text style={styles.badgeText}>-{item.discount}%</Text></View>}
                    </View>

                    <Text style={{ color: theme.textSecondary, fontSize: 12 }} numberOfLines={1}>
                        {item.category ? item.category : (item.descripcion || 'Sin descripción')}
                    </Text>
                </View>
                
                <View style={{ alignItems: 'flex-end', minWidth: 70 }}>
                    {item.old_price && item.old_price > item.precio && (
                        <Text style={[styles.oldPrice, { color: theme.textSecondary }]}>S/. {item.old_price}</Text>
                    )}
                    <Text style={[styles.price, { color: theme.primary }]}>S/. {item.precio}</Text>
                    <Text style={{ color: item.stock < 5 ? COLORES.danger : theme.textSecondary, fontSize: 12, fontWeight: 'bold' }}>
                        Stock: {item.stock}
                    </Text>
                </View>
                
                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.border} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
            )}
            
            ListFooterComponent={
                <View style={{ marginBottom: 100 }}>
                    {/* Usamos el componente importado correctamente */}
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={handlePageChange} 
                    />
                </View>
            }
            ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 50, color: theme.textSecondary }}>No hay productos registrados.</Text>
            }
        />
      )}

      <AddProductModal 
        visible={showProductModal} 
        onClose={() => setShowProductModal(false)} 
        onSuccess={() => fetchInventory(currentPage)} 
        productToEdit={selectedProduct} 
      />
      
      <POSModal visible={showPOS} onClose={() => setShowPOS(false)} onSaleComplete={() => fetchInventory(1)} />
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
  card: { flexDirection: 'row', padding: 12, borderRadius: 12, marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  imageContainer: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  productImage: { width: '100%', height: '100%' },
  prodName: { fontSize: 15, fontWeight: 'bold', flexShrink: 1 },
  price: { fontSize: 15, fontWeight: 'bold' },
  oldPrice: { fontSize: 11, textDecorationLine: 'line-through', marginRight: 4 },
  badgeNew: { backgroundColor: '#42A5F5', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  badgeDiscount: { backgroundColor: '#FF7043', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: 'white', fontSize: 9, fontWeight: 'bold' }
});