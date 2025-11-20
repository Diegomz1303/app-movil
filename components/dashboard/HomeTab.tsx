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
import { LineChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useData } from '../../context/DataContext';
// 1. Importar hook de tema
import { useTheme } from '../../context/ThemeContext';

const screenWidth = Dimensions.get("window").width;

export default function HomeTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalCitas, setTotalCitas] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartValues, setChartValues] = useState<number[]>([]);
  const [chartReady, setChartReady] = useState(false);

  const { appointmentsTrigger, clientsTrigger } = useData();
  // 2. Usar tema y modo oscuro
  const { theme, isDark } = useTheme();

  const procesarDatos = useCallback((citas: any[], numClientes: number) => {
    const hoy = new Date();
    
    setTotalClientes(numClientes);
    setTotalCitas(citas.length);

    const ingresos = citas
      .filter(c => c.estado === 'completada')
      .reduce((acc, curr) => acc + (Number(curr.precio) || 0), 0);
    setTotalIngresos(ingresos);

    const meses: { [key: string]: number } = {};
    const etiquetas: string[] = [];
    const valores: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
      const nombreMes = d.toLocaleString('es-ES', { month: 'short' }); 
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      
      meses[key] = 0;
      etiquetas.push(nombreMes);
    }

    citas.forEach(cita => {
      if (cita.fecha) {
        const key = cita.fecha.substring(0, 7);
        if (meses[key] !== undefined) {
          meses[key] += 1;
        }
      }
    });

    const keysOrdenadas = Object.keys(meses).sort();
    keysOrdenadas.forEach(k => valores.push(meses[k]));

    setChartLabels(etiquetas);
    setChartValues(valores);
    setChartReady(true);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setChartReady(false); 
    
    try {
      const [responseCitas, responseClientes] = await Promise.all([
        supabase.from('citas').select('fecha, precio, estado'),
        supabase.from('clientes').select('*', { count: 'exact', head: true })
      ]);

      const citasData = responseCitas.data || [];
      const clientesCount = responseClientes.count || 0;

      procesarDatos(citasData, clientesCount);

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

  const StatCard = React.memo(({ icon, title, value, color }: any) => (
    // 3. Fondo de tarjeta dinámico
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.iconBox, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>
      <View>
        {/* Textos dinámicos */}
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.textSecondary }]}>{title}</Text>
      </View>
    </View>
  ));

  return (
    // 4. Fondo transparente para ver el patrón
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
          <View style={styles.statsContainer}>
            <StatCard 
              icon="cash-multiple" 
              title="Ingresos Totales" 
              value={`S/. ${totalIngresos.toFixed(2)}`} 
              color={theme.primary} 
            />
            <View style={{ height: 10 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                 <StatCard 
                    icon="calendar-check" 
                    title="Citas Totales" 
                    value={totalCitas} 
                    color="#FFB74D" 
                  />
              </View>
              <View style={{ width: '48%' }}>
                 <StatCard 
                    icon="account-group" 
                    title="Clientes" 
                    value={totalClientes} 
                    color="#4FC3F7" 
                  />
              </View>
            </View>
          </View>

          {/* 5. Contenedor del gráfico dinámico */}
          <View style={[styles.chartContainer, { backgroundColor: theme.card }]}>
            <View style={styles.chartHeader}>
               <MaterialCommunityIcons name="chart-line" size={20} color={theme.text} />
               <Text style={[styles.chartTitle, { color: theme.text }]}>Citas de los últimos 6 meses</Text>
            </View>
            
            {chartReady && chartValues.length > 0 ? (
              <LineChart
                data={{
                  labels: chartLabels,
                  datasets: [{ data: chartValues }]
                }}
                width={screenWidth - 40}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                fromZero
                chartConfig={{
                  // 6. Colores del gráfico dinámicos
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => isDark ? `rgba(76, 175, 80, ${opacity})` : `rgba(76, 175, 80, ${opacity})`, // Verde siempre
                  labelColor: (opacity = 1) => isDark ? `rgba(255, 255, 255, ${opacity})` : `rgba(0, 0, 0, ${opacity})`, // Texto blanco en dark mode
                  style: { borderRadius: 16 },
                  propsForDots: { r: "4", strokeWidth: "2", stroke: COLORES.principalDark }
                }}
                style={{ marginVertical: 8, borderRadius: 16 }}
                withInnerLines={true}
                withOuterLines={true}
              />
            ) : (
               <View style={{height: 220, justifyContent: 'center', alignItems: 'center'}}>
                  <ActivityIndicator color={theme.primary} />
               </View>
            )}
          </View>

          {/* 7. Banner Info dinámico */}
          <View style={[
              styles.infoBanner, 
              { backgroundColor: isDark ? '#37474F' : '#FFF9C4' } // Amarillo suave en light, Gris azulado en dark
            ]}>
             <MaterialCommunityIcons name="lightbulb-on-outline" size={24} color={isDark ? '#FFD54F' : '#555'} />
             <Text style={[styles.infoText, { color: isDark ? '#ECEFF1' : '#666' }]}>
                Recuerda registrar los pagos al completar una cita para ver tus ingresos reflejados aquí.
             </Text>
          </View>
          
          <View style={{ height: 100 }} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 }, // Quitamos color fijo
  header: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 20 },
  welcomeText: { fontSize: 28, fontWeight: 'bold' },
  dateText: { fontSize: 14, marginTop: 5 },
  
  statsContainer: { paddingHorizontal: 20, marginBottom: 20 },
  statCard: {
    borderRadius: 16, padding: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBox: {
    width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statTitle: { fontSize: 12 },

  chartContainer: {
    marginHorizontal: 20, borderRadius: 16, padding: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    alignItems: 'center'
  },
  chartHeader: { flexDirection: 'row', alignSelf: 'flex-start', marginBottom: 10, alignItems: 'center', gap: 8 },
  chartTitle: { fontSize: 16, fontWeight: 'bold' },

  infoBanner: {
    margin: 20, padding: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 }
});