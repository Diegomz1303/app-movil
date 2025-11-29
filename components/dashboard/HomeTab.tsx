import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

export default function HomeTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Solo contadores operativos (Sin dinero)
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [totalProductos, setTotalProductos] = useState(0);

  const { appointmentsTrigger, clientsTrigger } = useData();
  const { theme, isDark } = useTheme();

  const fetchData = async () => {
    setLoading(true);
    
    try {
      // 1. Contar Citas (Solo cantidad, sin traer datos pesados)
      const resCitas = await supabase
        .from('citas')
        .select('*', { count: 'exact', head: true });

      // 2. Contar Clientes
      const resClientes = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true });

      // 3. Contar Productos (Inventario)
      const resProductos = await supabase
        .from('productos')
        .select('*', { count: 'exact', head: true });

      setTotalCitas(resCitas.count || 0);
      setTotalClientes(resClientes.count || 0);
      setTotalProductos(resProductos.count || 0);

    } catch (e) {
      console.error("Error cargando datos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appointmentsTrigger, clientsTrigger]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  // Componente interno para las tarjetas
  const StatCard = React.memo(({ icon, title, value, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={28} color="white" />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      </View>
    </View>
  ));

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: 'transparent' }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>Hola, Equipo 👋</Text>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>Panel Operativo</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <>
          {/* Banner de Bienvenida */}
          <View style={[styles.banner, { backgroundColor: theme.card }]}>
             <MaterialCommunityIcons name="paw" size={40} color={theme.primary} />
             <View style={{marginLeft: 15, flex: 1}}>
                <Text style={[styles.bannerTitle, {color: theme.text}]}>¡Buen turno!</Text>
                <Text style={{color: theme.textSecondary, fontSize: 13}}>Recuerda registrar cada cita y mantener actualizado el inventario.</Text>
             </View>
          </View>

          {/* ================= SECCIÓN RESUMEN OPERATIVO ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Resumen Global</Text>
            
            <View style={styles.statsGrid}>
                {/* Card de Citas Totales */}
                <StatCard 
                    icon="calendar-check" 
                    title="Citas Registradas" 
                    value={totalCitas} 
                    color="#FFB74D" 
                />
                
                {/* Card de Clientes */}
                <StatCard 
                    icon="account-group" 
                    title="Clientes Totales" 
                    value={totalClientes} 
                    color="#4FC3F7" 
                />

                {/* Card de Productos */}
                <StatCard 
                    icon="package-variant-closed" 
                    title="Prod. en Inventario" 
                    value={totalProductos} 
                    color="#81C784" 
                />

                {/* Card Informativa */}
                <StatCard 
                    icon="information-outline" 
                    title="Estado Sistema" 
                    value="En Línea" 
                    color={theme.primary} 
                />
            </View>
          </View>

          {/* Banner Info Empleado */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? '#37474F' : '#E3F2FD' }]}>
             <MaterialCommunityIcons name="shield-check-outline" size={24} color={isDark ? '#90CAF9' : '#1976D2'} />
             <Text style={[styles.infoText, { color: isDark ? '#E3F2FD' : '#0D47A1' }]}>
                Modo Empleado: La visualización de reportes financieros e ingresos está deshabilitada.
             </Text>
          </View>
          
          <View style={{ height: 100 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 10 },
  welcomeText: { fontSize: 28, fontWeight: 'bold' },
  dateText: { fontSize: 14, marginTop: 5 },
  
  banner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  bannerTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },

  sectionContainer: { marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 15, marginTop: 5 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 15
  },
  statCard: {
    borderRadius: 16, 
    padding: 15,
    width: '47%', // Para que entren 2 por fila
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  iconBox: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 5
  },
  statValue: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  statTitle: { fontSize: 12, textAlign: 'center' },

  infoBanner: {
    margin: 20, padding: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 12
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '500' }
});