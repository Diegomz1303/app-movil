import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Dimensions, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit'; // Cambiado a BarChart
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

export default function HomeTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados Servicios (Citas)
  const [ingresosServicios, setIngresosServicios] = useState(0);
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [citasChartValues, setCitasChartValues] = useState<number[]>([]);

  // Estados Ventas (Productos)
  const [ingresosVentas, setIngresosVentas] = useState(0);
  const [totalVentas, setTotalVentas] = useState(0);
  const [ventasChartValues, setVentasChartValues] = useState<number[]>([]);

  const [chartReady, setChartReady] = useState(false);

  const { appointmentsTrigger, clientsTrigger } = useData();
  const { theme, isDark } = useTheme();

  const procesarDatos = useCallback((citas: any[], ventas: any[], numClientes: number) => {
    const hoy = new Date();
    
    // --- 1. Procesar Totales Generales ---
    setTotalClientes(numClientes);
    setTotalCitas(citas.length);
    setTotalVentas(ventas.length);

    // Sumar Ingresos Servicios
    const totalServ = citas
      .filter(c => c.estado === 'completada')
      .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
    setIngresosServicios(totalServ);

    // Sumar Ingresos Ventas
    const totalProd = ventas
      .reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    setIngresosVentas(totalProd);

    // --- 2. Procesar Gráficos (Últimos 6 meses) ---
    const meses: { [key: string]: { citas: number, ventas: number } } = {};
    const etiquetas: string[] = [];
    const valoresCitas: number[] = [];
    const valoresVentas: number[] = [];

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const nombreMes = d.toLocaleString('es-ES', { month: 'short' }); 
      // Clave YYYY-MM para agrupar
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      meses[key] = { citas: 0, ventas: 0 };
      etiquetas.push(nombreMes); // Ej: "jun", "jul"
    }

    // Contar Citas por mes
    citas.forEach(cita => {
      if (cita.fecha) {
        const key = cita.fecha.substring(0, 7); // YYYY-MM
        if (meses[key]) meses[key].citas += 1;
      }
    });

    // Contar Ventas por mes
    ventas.forEach(venta => {
      if (venta.fecha) {
        const key = venta.fecha.substring(0, 7); // YYYY-MM
        if (meses[key]) meses[key].ventas += 1;
      }
    });

    // Extraer valores ordenados
    const keysOrdenadas = Object.keys(meses).sort();
    keysOrdenadas.forEach(k => {
        valoresCitas.push(meses[k].citas);
        valoresVentas.push(meses[k].ventas);
    });

    setChartLabels(etiquetas);
    setCitasChartValues(valoresCitas);
    setVentasChartValues(valoresVentas);
    setChartReady(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setChartReady(false); 
    
    try {
      // Traemos Citas, Clientes y Ventas en paralelo
      const [resCitas, resClientes, resVentas] = await Promise.all([
        supabase.from('citas').select('fecha, precio, estado'),
        supabase.from('clientes').select('*', { count: 'exact', head: true }),
        supabase.from('ventas').select('fecha, total') // Asumiendo que creaste la tabla ventas
      ]);

      const citasData = resCitas.data || [];
      const ventasData = resVentas.data || [];
      const clientesCount = resClientes.count || 0;

      procesarDatos(citasData, ventasData, clientesCount);

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

  const StatCard = React.memo(({ icon, title, value, color, fullWidth }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.card, width: fullWidth ? '100%' : '48%' }]}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>
      <View>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      </View>
    </View>
  ));

  const renderBarChart = (dataValues: number[], barColor: string) => (
    <BarChart
        data={{
            labels: chartLabels,
            datasets: [{ data: dataValues }]
        }}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        chartConfig={{
            backgroundColor: theme.card,
            backgroundGradientFrom: theme.card,
            backgroundGradientTo: theme.card,
            decimalPlaces: 0,
            // Color de las barras
            color: (opacity = 1) => barColor, 
            // Color de las etiquetas (ejes)
            labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`,
            barPercentage: 0.7,
            style: { borderRadius: 16 },
        }}
        style={{ marginVertical: 8, borderRadius: 16 }}
        showValuesOnTopOfBars={true} // Muestra el número arriba de la barra
    />
  );

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: 'transparent' }]} 
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.welcomeText, { color: theme.text }]}>Resumen General</Text>
        <Text style={[styles.dateText, { color: theme.textSecondary }]}>Bienvenido de nuevo</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />
      ) : (
        <>
          {/* ================= SECCIÓN SERVICIOS ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Servicios & Citas</Text>
            
            <View style={styles.statsContainer}>
                <StatCard 
                    icon="cash-multiple" 
                    title="Ingresos Servicios" 
                    value={`S/. ${ingresosServicios.toFixed(2)}`} 
                    color={theme.primary} 
                    fullWidth
                />
                <View style={{ height: 10 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <StatCard icon="calendar-check" title="Citas Realizadas" value={totalCitas} color="#FFB74D" />
                    <StatCard icon="account-group" title="Clientes Totales" value={totalClientes} color="#4FC3F7" />
                </View>
            </View>

            {/* Gráfico de Barras SERVICIOS */}
            <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
                <View style={styles.chartHeader}>
                    <MaterialCommunityIcons name="chart-bar" size={20} color={theme.text} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Citas (Últimos 6 meses)</Text>
                </View>
                
                {chartReady ? renderBarChart(citasChartValues, isDark ? `rgba(76, 175, 80, 1)` : `rgba(76, 175, 80, 1)`) : (
                    <ActivityIndicator color={theme.primary} style={{ height: 220 }} />
                )}
            </View>
          </View>

          {/* Divisor visual */}
          <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10, marginHorizontal: 20 }} />

          {/* ================= SECCIÓN VENTAS (PRODUCTOS) ================= */}
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionHeader, { color: theme.text }]}>Ventas de Tienda</Text>
            
            <View style={styles.statsContainer}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <StatCard 
                        icon="shopping" 
                        title="Ventas Totales" 
                        value={`S/. ${ingresosVentas.toFixed(2)}`} 
                        color="#FF7043" 
                    />
                    <StatCard 
                        icon="receipt" 
                        title="Transacciones" 
                        value={totalVentas} 
                        color="#AB47BC" 
                    />
                </View>
            </View>

            {/* Gráfico de Barras VENTAS */}
            <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
                <View style={styles.chartHeader}>
                    <MaterialCommunityIcons name="chart-bar" size={20} color={theme.text} />
                    <Text style={[styles.chartTitle, { color: theme.text }]}>Ventas (Últimos 6 meses)</Text>
                </View>
                
                {chartReady ? renderBarChart(ventasChartValues, `rgba(255, 112, 67, 1)`) : (
                    <ActivityIndicator color={theme.primary} style={{ height: 220 }} />
                )}
            </View>
          </View>

          {/* Banner Info */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? '#37474F' : '#FFF9C4' }]}>
             <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={isDark ? '#FFD54F' : '#555'} />
             <Text style={[styles.infoText, { color: isDark ? '#ECEFF1' : '#666' }]}>
                Recuerda: Los gráficos muestran la cantidad de operaciones realizadas cada mes.
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
  
  sectionContainer: { marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20, marginBottom: 10, marginTop: 10 },

  statsContainer: { paddingHorizontal: 20, marginBottom: 15 },
  statCard: {
    borderRadius: 16, padding: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBox: {
    width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  statValue: { fontSize: 18, fontWeight: 'bold' }, // Ajustado un poco el tamaño
  statTitle: { fontSize: 12 },

  chartContainer: {
    marginHorizontal: 20, borderRadius: 16, padding: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    alignItems: 'center'
  },
  chartHeader: { flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 5, alignItems: 'center', gap: 8 },
  chartTitle: { fontSize: 14, fontWeight: 'bold' },

  infoBanner: {
    margin: 20, padding: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 }
});