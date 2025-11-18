// lib/supabase.ts
import 'react-native-url-polyfill/auto'; // ¡Importante! Debe ir primero
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// --- ¡Pega tus claves de Supabase aquí! ---
const supabaseUrl = 'https://nskuwdyyufzlomdccvyo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5za3V3ZHl5dWZ6bG9tZGNjdnlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjI4MDMsImV4cCI6MjA3ODk5ODgwM30.Ev0OPzRlY5VqsGObLAEm44x2CMhc1Uzvq-oJ9dBKXTk';
// ------------------------------------------

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Usa AsyncStorage para guardar la sesión
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});