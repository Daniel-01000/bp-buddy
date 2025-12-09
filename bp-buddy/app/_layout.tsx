import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { initializeStore } from '@/store/bpStore';
import { isAuthenticated, initializeAuth } from '@/store/authStore';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Initialize both auth and store
    const init = async () => {
      await initializeAuth();
      await initializeStore();
      setIsReady(true);
    };
    init();
  }, []);

  useEffect(() => {
    if (!isReady) return;
    
    // Protect tabs route - redirect to login if not authenticated
    const userIsAuthenticated = isAuthenticated();
    const inAuthGroup = segments[0] === '(tabs)';
    
    // Only redirect if not authenticated and trying to access protected routes
    if (!userIsAuthenticated && inAuthGroup) {
      router.replace('/login');
    }
  }, [isReady]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="gdpr-consent" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

