import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import LottieView from 'lottie-react-native'; // Importamos Lottie

// --- Usamos los mismos colores ---
const COLORES = {
  principal: '#007bff',
  principalClaro: '#F0F4F7',
  texto: '#333',
  textoSecundario: '#888',
  fondoBlanco: '#FFFFFF',
};

// --- ¡AQUÍ ESTÁ LA CORRECCIÓN DE TYPESCRIPT! ---
// Definimos los tipos para nuestro navegador
type RegisterNavigationProps = {
  navigate: (screen: string) => void;
  goBack: () => void;
};
// -------------------------------------------------

export default function RegisterScreen() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // --- ¡AQUÍ APLICAMOS LA CORRECCIÓN! ---
  const navigation = useNavigation<RegisterNavigationProps>();

  // --- Función de Registro con Supabase ---
  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert('Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: nombre,
        },
      },
    });
    setLoading(false);

    if (error) {
      if (error.message.includes('Email rate limit exceeded')) {
        Alert.alert(
          'Límite alcanzado',
          'Has intentado registrarte muchas veces. Por favor, espera un momento.'
        );
      } else if (error.message.includes('invalid')) {
         Alert.alert('Error', 'El correo electrónico no es válido.');
      } else {
        Alert.alert('Error al Registrar', error.message);
      }
    } else {
      Alert.alert(
        '¡Registro Exitoso!',
        'Tu cuenta se ha creado. Ya puedes iniciar sesión.'
      );
      navigation.navigate('Login'); // ¡La línea roja ya no debe aparecer!
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORES.principal} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {/* --- 1. EL CABEZAL DE COLOR --- */}
          <View style={styles.headerContainer}>
            <LottieView
              source={require('../assets/pet-animation.json')}
              style={styles.lottieAnimation}
              autoPlay
              loop
            />
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={COLORES.fondoBlanco}
              />
            </TouchableOpacity>
          </View>

          {/* --- 2. EL FORMULARIO BLANCO --- */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Crear Cuenta</Text>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="account-outline"
                size={22}
                color={COLORES.textoSecundario}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre Completo"
                value={nombre}
                onChangeText={setNombre}
                placeholderTextColor={COLORES.textoSecundario}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="email-outline"
                size={22}
                color={COLORES.textoSecundario}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Correo Electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORES.textoSecundario}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={22}
                color={COLORES.textoSecundario}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
                placeholderTextColor={COLORES.textoSecundario}
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Registrando...' : 'Registrarse'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>¿Ya tienes cuenta? </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>Ingresa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORES.principal,
  },
  container: {
    flex: 1,
    backgroundColor: COLORES.principalClaro,
  },
  headerContainer: {
    backgroundColor: COLORES.principal,
    paddingTop: 50,
    paddingBottom: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    padding: 10,
    borderRadius: 50,
  },
  lottieAnimation: {
    width: 250,
    height: 250,
    marginBottom: 0,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORES.fondoBlanco,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -30,
    padding: 30,
    paddingTop: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORES.texto,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.principalClaro,
    borderRadius: 12,
    marginBottom: 15,
    height: 55,
  },
  inputIcon: {
    marginLeft: 20,
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORES.texto,
    paddingRight: 15,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: COLORES.principal,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4.65,
    elevation: 6,
  },
  buttonText: {
    color: COLORES.fondoBlanco,
    fontSize: 18,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  registerText: {
    fontSize: 16,
    color: COLORES.textoSecundario,
  },
  registerButtonText: {
    color: COLORES.principal,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
});