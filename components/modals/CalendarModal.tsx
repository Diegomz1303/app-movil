import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Dimensions, FlatList, Animated, Platform, ActivityIndicator,
  KeyboardAvoidingView, TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Animatable from 'react-native-animatable';

import { supabase } from '../../lib/supabase';
import { COLORES } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';

// Configuración Español para el Calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: "Hoy"
};
LocaleConfig.defaultLocale = 'es';

const { width, height } = Dimensions.get('window');

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CalendarModal({ visible, onClose }: CalendarModalProps) {
  const { theme, isDark } = useTheme();
  const scaleValue = useRef(new Animated.Value(0)).current;
  
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Animación de entrada "Bouncy"
  useEffect(() => {
    if (visible) {
      fetchCitas();
      scaleValue.setValue(0);
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchCitas = async () => {
    setLoading(true);
    try {
      // Traer citas futuras y pasadas para llenar el calendario
      const { data, error } = await supabase
        .from('citas')
        .select(`
          id, fecha, hora, servicio, estado,
          mascotas (nombre),
          clientes (nombres, apellidos)
        `)
        .order('hora', { ascending: true });

      if (!error && data) {
        setCitas(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Procesar puntos para el calendario
  const markedDates = useMemo(() => {
    const marks: any = {};
    
    citas.forEach(cita => {
      // CORRECCIÓN AQUÍ: Usamos un color naranja explícito ya que COLORES.secondary no existe
      let color = '#FF9800'; // Color naranja para Pendiente
      
      if (cita.estado === 'confirmada') color = theme.primary;
      if (cita.estado === 'completada') color = COLORES.principal; // Verde
      if (cita.estado === 'cancelada') color = COLORES.danger;     // Rojo

      // Solo marcamos si no está marcado ya, para evitar sobreescribir con un color diferente si hay múltiples citas
      if (!marks[cita.fecha]) {
        marks[cita.fecha] = { marked: true, dotColor: color };
      }
    });

    // Marcar día seleccionado (sobrescribe o fusiona con la marca existente)
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: theme.primary,
      selectedTextColor: 'white'
    };

    return marks;
  }, [citas, selectedDate, theme]);

  // Filtrar citas del día seleccionado
  const citasDelDia = citas.filter(c => c.fecha === selectedDate);

  const renderCitaItem = ({ item, index }: any) => (
    <Animatable.View 
      animation="fadeInUp" 
      delay={index * 100} 
      duration={400}
      style={[styles.card, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
    >
      <View style={[styles.timeBox, { backgroundColor: theme.card }]}>
        <Text style={[styles.timeText, { color: theme.text }]}>{item.hora.slice(0, 5)}</Text>
      </View>
      <View style={styles.infoBox}>
        <Text style={[styles.serviceText, { color: theme.primary }]}>{item.servicio}</Text>
        <Text style={[styles.petText, { color: theme.text }]}>
           <MaterialCommunityIcons name="paw" size={12} /> {item.mascotas?.nombre}
        </Text>
        <Text style={[styles.clientText, { color: theme.textSecondary }]}>
           {item.clientes?.nombres} {item.clientes?.apellidos}
        </Text>
      </View>
      {/* Indicador de estado visual */}
      <View style={[styles.statusDot, { 
          backgroundColor: item.estado === 'completada' ? COLORES.principal : 
                           item.estado === 'confirmada' ? theme.primary : 
                           item.estado === 'cancelada' ? COLORES.danger : '#FF9800' 
      }]} />
    </Animatable.View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.centeredView}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <Animated.View style={[
            styles.modalView, 
            { transform: [{ scale: scaleValue }], backgroundColor: theme.card }
        ]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                <MaterialCommunityIcons name="calendar-month" size={24} color={theme.primary} />
                <Text style={[styles.title, { color: theme.text }]}>Calendario de Citas</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Calendario */}
          <View style={styles.calendarWrapper}>
            <Calendar
              current={selectedDate}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              markedDates={markedDates}
              theme={{
                calendarBackground: 'transparent',
                textSectionTitleColor: theme.textSecondary,
                selectedDayBackgroundColor: theme.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: theme.primary,
                dayTextColor: theme.text,
                textDisabledColor: isDark ? '#444' : '#d9e1e8',
                dotColor: theme.primary,
                monthTextColor: theme.text,
                indicatorColor: theme.primary,
                arrowColor: theme.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12
              }}
            />
          </View>

          {/* Lista de citas del día */}
          <View style={[styles.listContainer, { backgroundColor: theme.background }]}>
            <Text style={[styles.listTitle, { color: theme.textSecondary }]}>
                {format(parseISO(selectedDate), "EEEE, d 'de' MMMM", { locale: es })}
            </Text>
            
            {loading ? (
                <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={citasDelDia}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderCitaItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="calendar-blank" size={40} color={theme.border} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>Sin citas para este día</Text>
                        </View>
                    }
                />
            )}
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalView: {
    width: width * 0.9, height: height * 0.85,
    borderRadius: 25, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, elevation: 10
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  
  calendarWrapper: { padding: 10 },
  
  listContainer: { flex: 1, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, marginTop: 10 },
  listTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 15, textTransform: 'capitalize' },
  
  card: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, borderRadius: 12, padding: 10,
    borderWidth: 1,
  },
  timeBox: { padding: 8, borderRadius: 8, marginRight: 12, minWidth: 60, alignItems: 'center' },
  timeText: { fontWeight: 'bold', fontSize: 13 },
  infoBox: { flex: 1 },
  serviceText: { fontWeight: 'bold', fontSize: 14 },
  petText: { fontSize: 13, marginTop: 2 },
  clientText: { fontSize: 11, marginTop: 2 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 10 },
  
  emptyState: { alignItems: 'center', marginTop: 40 }
});