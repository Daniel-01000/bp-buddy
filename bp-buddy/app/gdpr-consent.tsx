import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function GDPRConsentScreen() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!accepted) return;
    
    setLoading(true);
    // Store consent in AsyncStorage or backend
    try {
      // TODO: Save consent to user profile
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving consent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={40} name="shield.fill" color="#60A5FA" />
        <Text style={styles.title}>Privacy & Data Protection</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View>
          <Text style={styles.sectionTitle}>Your Privacy Matters</Text>
          <Text style={styles.text}>
            BP Buddy is committed to protecting your health data and privacy in accordance with GDPR regulations.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Collect</Text>
          <Text style={styles.text}>• Blood pressure readings and health data</Text>
          <Text style={styles.text}>• Account information (email, name)</Text>
          <Text style={styles.text}>• Usage data to improve our service</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          <Text style={styles.text}>• Store and display your BP readings</Text>
          <Text style={styles.text}>• Provide personalized health insights</Text>
          <Text style={styles.text}>• Improve app functionality</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <Text style={styles.text}>• Access your data at any time</Text>
          <Text style={styles.text}>• Request data deletion</Text>
          <Text style={styles.text}>• Export your health records</Text>
          <Text style={styles.text}>• Withdraw consent anytime</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Security</Text>
          <Text style={styles.text}>
            Your health data is encrypted and stored securely. We never share your personal information with third parties without your explicit consent.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Features</Text>
          <Text style={styles.text}>
            Our BP Coach uses AI to provide health guidance. Your conversations are processed securely and are not used to train AI models.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <IconSymbol size={16} name="checkmark" color="#1E293B" />}
          </View>
          <Text style={styles.checkboxText}>
            I have read and agree to the privacy policy and consent to the processing of my health data as described above.
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, !accepted && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!accepted || loading}
          >
            {loading ? (
              <ActivityIndicator color="#1E293B" />
            ) : (
              <Text style={[styles.buttonText, !accepted && styles.buttonTextDisabled]}>
                Continue to App
              </Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#60A5FA',
    marginBottom: 12,
  },
  text: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#60A5FA',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#60A5FA',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  footer: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#60A5FA',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  buttonText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#64748B',
  },
  linkText: {
    color: '#60A5FA',
    textAlign: 'center',
    fontSize: 16,
  },
});
