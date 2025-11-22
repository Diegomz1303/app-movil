import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PieChart } from 'react-native-chart-kit';
import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';

// Librerías para Excel
// --- CORRECCIÓN: Usamos la importación 'legacy' para evitar el error de la versión nueva de Expo ---
import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';

// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
}

type ReportType = 'services' | 'products';

export default function ReportsModal({ visible, onClose }: ReportsModalProps) {
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const { theme, isDark } = useTheme();
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // Estado para controlar qué reporte vemos
  const [activeTab, setActiveTab] = useState<ReportType>('services');

  // Datos Separados
  const [statsServices, setStatsServices] = useState({ total: 0, count: 0, avg: 0, chart: [] as any[] });
  const [statsProducts, setStatsProducts] = useState({ total: 0, count: 0, avg: 0, chart: [] as any[] });

  // Datos Crudos (Para el Excel)
  const [rawCitas, setRawCitas] = useState<any[]>([]);
  const [rawVentas, setRawVentas] = useState<any[]>([]);

  const CHART_COLORS = [COLORES.principal, '#FFB74D', '#4FC3F7', '#E57373', '#9575CD'];

  useEffect(() => {
    if (visible) {
      generateReport();
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // 1. Traer Citas (Servicios)
      const { data: dataCitas, error: errorCitas } = await supabase
        .from('citas')
        .select(`
            id, 
            fecha, 
            hora, 
            servicio, 
            precio, 
            metodo_pago, 
            estado,
            mascotas (nombre),
            clientes (nombres, apellidos)
        `)
        .eq('estado', 'completada')
        .gte('fecha', startStr)
        .lte('fecha', endStr);

      if (errorCitas) throw errorCitas;

      const citas = dataCitas || [];
      setRawCitas(citas); 

      const totalCitas = citas.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
      const countCitas = citas.length;
      const avgCitas = countCitas > 0 ? totalCitas / countCitas : 0;
      const chartCitas = processChartData(citas);

      setStatsServices({
        total: totalCitas,
        count: countCitas,
        avg: avgCitas,
        chart: chartCitas
      });

      // 2. Traer Ventas de Productos
      const { data: dataVentas, error: errorVentas } = await supabase
        .from('ventas')
        .select('id, fecha, total, metodo_pago')
        .gte('fecha', startStr)
        .lte('fecha', endStr);

      const ventas = (!errorVentas && dataVentas) ? dataVentas : [];
      setRawVentas(ventas);

      const totalVentas = ventas.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      const countVentas = ventas.length;
      const avgVentas = countVentas > 0 ? totalVentas / countVentas : 0;
      const chartVentas = processChartData(ventas);

      setStatsProducts({
        total: totalVentas,
        count: countVentas,
        avg: avgVentas,
        chart: chartVentas
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (data: any[]) => {
    const grouped: { [key: string]: number } = {};
    data.forEach(item => {
      const metodo = item.metodo_pago || 'Desconocido';
      grouped[metodo] = (grouped[metodo] || 0) + 1;
    });

    return Object.keys(grouped).map((key, index) => ({
      name: key,
      population: grouped[key],
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: isDark ? "#CCC" : "#7F7F7F",
      legendFontSize: 12
    }));
  };

  // --- FUNCIÓN PARA EXPORTAR A EXCEL ---
  const exportToExcel = async () => {
    if (rawCitas.length === 0 && rawVentas.length === 0) {
        Alert.alert("Sin datos", "No hay información para exportar en estas fechas.");
        return;
    }

    setExporting(true);
    try {
        // 1. Preparar datos
        const serviciosData = rawCitas.map(c => ({
            ID: c.id,
            Fecha: c.fecha,
            Hora: c.hora,
            Servicio: c.servicio,
            Mascota: c.mascotas?.nombre || 'N/A',
            Cliente: c.clientes ? `${c.clientes.nombres} ${c.clientes.apellidos}` : 'N/A',
            Precio: c.precio,
            Metodo_Pago: c.metodo_pago
        }));

        const ventasData = rawVentas.map(v => ({
            ID_Venta: v.id,
            Fecha: v.fecha,
            Total: v.total,
            Metodo_Pago: v.metodo_pago
        }));

        // 2. Crear Libro Excel
        const wb = XLSX.utils.book_new();
        
        if (serviciosData.length > 0) {
            const wsServices = XLSX.utils.json_to_sheet(serviciosData);
            XLSX.utils.book_append_sheet(wb, wsServices, "Servicios");
        }

        if (ventasData.length > 0) {
            const wsSales = XLSX.utils.json_to_sheet(ventasData);
            XLSX.utils.book_append_sheet(wb, wsSales, "Ventas Productos");
        }

        // 3. Generar archivo Base64
        const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
        const fileName = `Reporte_PetShop_${startDate.toISOString().split('T')[0]}.xlsx`;
        
        // Usamos || "" para asegurar que no sea null
        const uri = (FileSystem.documentDirectory || "") + fileName;

        // 4. Guardar
        // Usamos la importación 'legacy' arriba, así que esto debería funcionar
        await FileSystem.writeAsStringAsync(uri, wbout, { encoding: 'base64' });
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri);
        } else {
            Alert.alert("Error", "No se puede compartir en este dispositivo");
        }

    } catch (error: any) {
        console.log(error);
        Alert.alert("Error exportando", error.message);
    } finally {
        setExporting(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentType = showPicker;
    if (Platform.OS === 'android') setShowPicker(null);
    
    if (selectedDate && currentType) {
      if (currentType === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const currentStats = activeTab === 'services' ? statsServices : statsProducts;
  const currentColor = activeTab === 'services' ? theme.primary : '#FF9800'; 

  const Card = ({ title, value, icon, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={24} color="white" />
      </View>
      <View>
        <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>{title}</Text>
        <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );

  const textStyle = { color: theme.text };
  const inputBg = { backgroundColor: theme.inputBackground, borderColor: theme.border };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, textStyle]}>Reporte Financiero</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'services' && { backgroundColor: theme.primary }]}
                onPress={() => setActiveTab('services')}
            >
                <MaterialCommunityIcons name="dog-service" size={20} color={activeTab === 'services' ? 'white' : theme.textSecondary} />
                <Text style={[styles.tabText, { color: activeTab === 'services' ? 'white' : theme.textSecondary }]}>Servicios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'products' && { backgroundColor: '#FF9800' }]} 
                onPress={() => setActiveTab('products')}
            >
                <MaterialCommunityIcons name="store" size={20} color={activeTab === 'products' ? 'white' : theme.textSecondary} />
                <Text style={[styles.tabText, { color: activeTab === 'products' ? 'white' : theme.textSecondary }]}>Ventas Productos</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Filtros y Botones */}
            <View style={styles.dateRow}>
              <TouchableOpacity style={[styles.dateInput, inputBg]} onPress={() => setShowPicker('start')}>
                <MaterialCommunityIcons name="calendar" size={18} color={theme.textSecondary} />
                <Text style={[styles.dateText, textStyle]}>{startDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              <MaterialCommunityIcons name="arrow-right" size={16} color={theme.textSecondary} />
              <TouchableOpacity style={[styles.dateInput, inputBg]} onPress={() => setShowPicker('end')}>
                <MaterialCommunityIcons name="calendar" size={18} color={theme.textSecondary} />
                <Text style={[styles.dateText, textStyle]}>{endDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              
              <View style={{flexDirection: 'row', gap: 8}}>
                  {/* Botón Refrescar */}
                  <TouchableOpacity style={[styles.iconBtn, { backgroundColor: currentColor }]} onPress={generateReport}>
                     <MaterialCommunityIcons name="refresh" size={20} color="white" />
                  </TouchableOpacity>

                  {/* Botón Excel */}
                  <TouchableOpacity 
                    style={[styles.iconBtn, { backgroundColor: '#217346' }]} 
                    onPress={exportToExcel}
                    disabled={exporting}
                  >
                     {exporting ? 
                        <ActivityIndicator size="small" color="white" /> : 
                        <MaterialCommunityIcons name="microsoft-excel" size={20} color="white" />
                     }
                  </TouchableOpacity>
              </View>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={currentColor} style={{ marginVertical: 30 }} />
            ) : (
              <>
                <View style={[styles.mainStatCard, { backgroundColor: currentColor }]}>
                    <Text style={styles.mainStatLabel}>
                        {activeTab === 'services' ? 'Ingresos por Servicios' : 'Ventas de Productos'}
                    </Text>
                    <Text style={styles.mainStatValue}>S/. {currentStats.total.toFixed(2)}</Text>
                    <MaterialCommunityIcons 
                        name={activeTab === 'services' ? "content-cut" : "shopping"} 
                        size={40} 
                        color="rgba(255,255,255,0.2)" 
                        style={styles.bgIcon} 
                    />
                </View>

                <View style={styles.rowStats}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                     <Card 
                      title="Transacciones" 
                      value={currentStats.count.toString()} 
                      icon="receipt" 
                      color={activeTab === 'services' ? "#66BB6A" : "#FFB74D"} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Card 
                      title="Ticket Prom." 
                      value={`S/. ${currentStats.avg.toFixed(0)}`} 
                      icon="chart-line" 
                      color={activeTab === 'services' ? "#42A5F5" : "#FF7043"} 
                    />
                  </View>
                </View>

                <Text style={[styles.sectionTitle, textStyle]}>Métodos de Pago</Text>
                
                <View style={[styles.chartCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  {currentStats.chart.length > 0 ? (
                    <PieChart
                      data={currentStats.chart}
                      width={width * 0.75}
                      height={180}
                      chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      }}
                      accessor={"population"}
                      backgroundColor={"transparent"}
                      paddingLeft={"0"}
                      center={[10, 0]}
                      absolute
                    />
                  ) : (
                    <Text style={[styles.noDataText, { color: theme.textSecondary }]}>No hay datos para este periodo</Text>
                  )}
                </View>
              </>
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>

        {showPicker && (
          <DateTimePicker
            value={showPicker === 'start' ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: {
    width: width * 0.9, maxHeight: height * 0.85,
    borderRadius: 25, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 15,
    overflow: 'hidden'
  },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    marginBottom: 15, paddingBottom: 10, borderBottomWidth: 1
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  tabContainer: { flexDirection: 'row', marginBottom: 15, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 4 },
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6 },
  tabText: { fontWeight: 'bold', fontSize: 13 },
  content: { paddingBottom: 10 },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  dateInput: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, width: '30%', gap: 4, borderWidth: 1
  },
  dateText: { fontSize: 11, fontWeight: '600' },
  iconBtn: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mainStatCard: {
    padding: 20, borderRadius: 16, marginBottom: 15, overflow: 'hidden', position: 'relative'
  },
  mainStatLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, marginBottom: 5 },
  mainStatValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  bgIcon: { position: 'absolute', right: 15, bottom: 15 },
  statCard: { 
    borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center'
  },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 12 },
  cardValue: { fontSize: 18, fontWeight: 'bold' },
  rowStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  chartCard: { 
    borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 1, justifyContent: 'center'
  },
  noDataText: { padding: 30, fontStyle: 'italic' }
});