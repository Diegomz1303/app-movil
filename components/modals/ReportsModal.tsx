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

// 1. Importamos el hook del tema
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ReportsModal({ visible, onClose }: ReportsModalProps) {
  // Animación
  const scaleValue = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(false);
  
  // 2. Usamos el tema
  const { theme, isDark } = useTheme();
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
  
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const [totalIngresos, setTotalIngresos] = useState(0);
  const [totalServicios, setTotalServicios] = useState(0);
  const [promedio, setPromedio] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  const CHART_COLORS = [COLORES.principal, '#FFB74D', '#4FC3F7', '#E57373', '#9575CD'];

  // Animación de entrada
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

      const { data, error } = await supabase
        .from('citas')
        .select('precio, metodo_pago')
        .eq('estado', 'completada')
        .gte('fecha', startStr)
        .lte('fecha', endStr);

      if (error) throw error;

      if (data) {
        const total = data.reduce((sum, item) => sum + (Number(item.precio) || 0), 0);
        const count = data.length;
        const avg = count > 0 ? total / count : 0;

        setTotalIngresos(total);
        setTotalServicios(count);
        setPromedio(avg);

        const grouped: { [key: string]: number } = {};
        data.forEach(item => {
          const metodo = item.metodo_pago || 'Desconocido';
          grouped[metodo] = (grouped[metodo] || 0) + 1;
        });

        const formattedChart = Object.keys(grouped).map((key, index) => ({
          name: key,
          population: grouped[key],
          color: CHART_COLORS[index % CHART_COLORS.length],
          legendFontColor: isDark ? "#CCC" : "#7F7F7F",
          legendFontSize: 12
        }));

        setChartData(formattedChart);
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo generar el reporte.");
    } finally {
      setLoading(false);
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

  // Estilos dinámicos comunes
  const textStyle = { color: theme.text };
  const textSecStyle = { color: theme.textSecondary };
  const inputBg = { backgroundColor: theme.inputBackground, borderColor: theme.border };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
        
        {/* Tarjeta Animada con Rebote */}
        <Animated.View style={[styles.modalView, { transform: [{ scale: scaleValue }], backgroundColor: theme.card }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, textStyle]}>Reporte Financiero</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Filtros compactos */}
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
              
              <TouchableOpacity style={styles.refreshBtn} onPress={generateReport}>
                 <MaterialCommunityIcons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={COLORES.principal} style={{ marginVertical: 30 }} />
            ) : (
              <>
                {/* Tarjeta Principal de Ingresos */}
                <View style={[styles.mainStatCard, { backgroundColor: theme.primary }]}>
                    <Text style={styles.mainStatLabel}>Ingresos Totales</Text>
                    <Text style={styles.mainStatValue}>S/. {totalIngresos.toFixed(2)}</Text>
                    <MaterialCommunityIcons name="cash" size={40} color="rgba(255,255,255,0.2)" style={styles.bgIcon} />
                </View>

                <View style={styles.rowStats}>
                  <View style={{ flex: 1, marginRight: 10 }}>
                     <Card 
                      title="Servicios" 
                      value={totalServicios.toString()} 
                      icon="check-circle" 
                      color="#FFB74D" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                     <Card 
                      title="Promedio" 
                      value={`S/. ${promedio.toFixed(0)}`} 
                      icon="chart-line" 
                      color="#4FC3F7" 
                    />
                  </View>
                </View>

                <Text style={[styles.sectionTitle, textStyle]}>Métodos de Pago</Text>
                
                <View style={[styles.chartCard, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                  {chartData.length > 0 ? (
                    <PieChart
                      data={chartData}
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
                    <Text style={[styles.noDataText, textSecStyle]}>No hay datos para este periodo</Text>
                  )}
                </View>
              </>
            )}
            
            <View style={{ height: 20 }} />
          </ScrollView>

        </Animated.View>

        {/* Date Pickers */}
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
  content: { paddingBottom: 10 },
  
  // Filtros Compactos
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  dateInput: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, width: '38%', gap: 6, borderWidth: 1
  },
  dateText: { fontSize: 12, fontWeight: '600' },
  refreshBtn: { 
    backgroundColor: COLORES.principal, padding: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center' 
  },

  // Tarjeta Principal (Verde grande)
  mainStatCard: {
    padding: 20, borderRadius: 16, marginBottom: 15, overflow: 'hidden', position: 'relative'
  },
  mainStatLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
  mainStatValue: { color: 'white', fontSize: 32, fontWeight: 'bold' },
  bgIcon: { position: 'absolute', right: 15, bottom: 15 },

  // Tarjetas Secundarias
  statCard: { 
    borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center'
  },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 12 },
  cardValue: { fontSize: 18, fontWeight: 'bold' },
  rowStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },

  // Gráfico
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  chartCard: { 
    borderRadius: 16, padding: 10, alignItems: 'center', borderWidth: 1, justifyContent: 'center'
  },
  noDataText: { padding: 30, fontStyle: 'italic' }
});