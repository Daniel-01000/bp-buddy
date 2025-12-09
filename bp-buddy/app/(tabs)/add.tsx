import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { addBPReading, type BPReading } from '@/store/bpStore';

export default function AddScreen() {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateInputs = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    const systolicNum = parseInt(systolic);
    const diastolicNum = parseInt(diastolic);

    // Check if inputs are numbers
    if (!systolic || isNaN(systolicNum)) {
      newErrors.systolic = 'Systolic pressure is required and must be a number';
    } else if (systolicNum < 70 || systolicNum > 250) {
      newErrors.systolic = 'Systolic pressure must be between 70-250 mmHg';
    }

    if (!diastolic || isNaN(diastolicNum)) {
      newErrors.diastolic = 'Diastolic pressure is required and must be a number';
    } else if (diastolicNum < 40 || diastolicNum > 150) {
      newErrors.diastolic = 'Diastolic pressure must be between 40-150 mmHg';
    }

    // Check if systolic > diastolic
    if (!isNaN(systolicNum) && !isNaN(diastolicNum) && systolicNum <= diastolicNum) {
      newErrors.general = 'Systolic pressure must be higher than diastolic pressure';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveReading = async () => {
    if (!validateInputs()) {
      return;
    }

    const newReading: BPReading = {
      id: Date.now().toString(),
      systolic: parseInt(systolic),
      diastolic: parseInt(diastolic),
      note: note.trim(),
      timestamp: new Date(),
    };

    // Save to MongoDB via bpStore
    await addBPReading(newReading);
    
    // Clear form
    setSystolic('');
    setDiastolic('');
    setNote('');
    setErrors({});

    Alert.alert(
      'Success',
      'Blood pressure reading saved successfully!',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <IconSymbol size={32} name="plus.circle.fill" color="#60A5FA" />
            <Text style={styles.title}>Add New Reading</Text>
            <Text style={styles.subtitle}>Record your blood pressure measurement</Text>
          </View>

          {errors.general && (
            <View style={styles.errorContainer}>
              <IconSymbol size={20} name="exclamationmark.triangle.fill" color="#EF4444" />
              <Text style={styles.errorText}>{errors.general}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Systolic Pressure (mmHg)</Text>
              <Text style={styles.hint}>Upper number (70-250)</Text>
              <TextInput
                style={[styles.input, errors.systolic && styles.inputError]}
                value={systolic}
                onChangeText={setSystolic}
                placeholder="120"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.systolic && <Text style={styles.fieldError}>{errors.systolic}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Diastolic Pressure (mmHg)</Text>
              <Text style={styles.hint}>Lower number (40-150)</Text>
              <TextInput
                style={[styles.input, errors.diastolic && styles.inputError]}
                value={diastolic}
                onChangeText={setDiastolic}
                placeholder="80"
                placeholderTextColor="#64748B"
                keyboardType="numeric"
                maxLength={3}
              />
              {errors.diastolic && <Text style={styles.fieldError}>{errors.diastolic}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Note (Optional)</Text>
              <Text style={styles.hint}>Additional details about your reading</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="e.g., taken after exercise, morning reading..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={saveReading}>
              <IconSymbol size={24} name="checkmark.circle.fill" color="#1E293B" />
              <Text style={styles.saveButtonText}>Save Reading</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#FEF2F2',
    fontSize: 16,
    flex: 1,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hint: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#334155',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  noteInput: {
    height: 100,
    paddingTop: 16,
  },
  fieldError: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#60A5FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: '600',
  },
});
