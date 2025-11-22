import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Contextos
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.log("Sesión no válida:", error.message);
          setSession(null);
        } else {
          setSession(session);
        }
      } catch (err) {
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // 2. Escuchar cambios en tiempo real (Login, Logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // CORRECCIÓN: Simplificamos la lógica.
      // Supabase envía automáticamente la sesión como 'null' si el usuario sale o es eliminado.
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <ThemeProvider> 
      <DataProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session ? (
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </DataProvider>
    </ThemeProvider>
  );
}