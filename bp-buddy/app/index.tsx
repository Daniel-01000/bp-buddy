import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { isAuthenticated } from '@/store/authStore';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Delay navigation to ensure root layout is mounted
    const timer = setTimeout(() => {
      const userIsAuthenticated = isAuthenticated();
      if (userIsAuthenticated) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#60A5FA" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
