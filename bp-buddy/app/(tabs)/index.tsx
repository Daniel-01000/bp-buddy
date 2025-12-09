import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { logout } from '@/store/authStore';

export default function HomeScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    console.log('Logout button pressed!');
    console.log('Logging out...');
    
    try {
      await logout();
      console.log('Logout successful, redirecting...');
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <IconSymbol size={20} name="rectangle.portrait.and.arrow.right" color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol size={48} name="heart.fill" color="#60A5FA" />
          <Text style={styles.title}>BP Buddy</Text>
          <Text style={styles.subtitle}>Your Blood Pressure Companion</Text>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeText}>
            Track your blood pressure readings and stay on top of your health.
          </Text>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/(tabs)/add')}
          >
            <IconSymbol size={24} name="plus" color="#1E293B" />
            <Text style={styles.addButtonText}>Add New Reading</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickStats}>
          <Text style={styles.quickStatsTitle}>Quick Actions</Text>
          
          <View style={styles.statsGrid}>
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/(tabs)/history')}
            >
              <IconSymbol size={32} name="clock.fill" color="#60A5FA" />
              <Text style={styles.statLabel}>View History</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.statCard}
              onPress={() => router.push('/chat-coach')}
            >
              <IconSymbol size={32} name="message.fill" color="#60A5FA" />
              <Text style={styles.statLabel}>Chat with Coach</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
  welcomeCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#334155',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: '#60A5FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '600',
  },
  quickStats: {
    flex: 1,
  },
  quickStatsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
});
