import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  FlatList,
  TouchableOpacity
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getAllBPReadings, subscribeToUpdates, type BPReading } from '@/store/bpStore';

export default function HistoryScreen() {
  const [bpReadings, setBpReadings] = useState<BPReading[]>([]);

  useEffect(() => {
    // Load readings on mount
    setBpReadings(getAllBPReadings());

    // Subscribe to updates
    const unsubscribe = subscribeToUpdates(() => {
      setBpReadings(getAllBPReadings());
    });

    return unsubscribe;
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getBPCategory = (systolic: number, diastolic: number) => {
    if (systolic < 120 && diastolic < 80) {
      return { category: 'Normal', color: '#10B981', icon: 'checkmark.circle.fill' };
    } else if (systolic < 130 && diastolic < 80) {
      return { category: 'Elevated', color: '#F59E0B', icon: 'exclamationmark.triangle.fill' };
    } else if (systolic < 140 || diastolic < 90) {
      return { category: 'High Stage 1', color: '#EF4444', icon: 'exclamationmark.triangle.fill' };
    } else if (systolic < 180 || diastolic < 120) {
      return { category: 'High Stage 2', color: '#DC2626', icon: 'exclamationmark.triangle.fill' };
    } else {
      return { category: 'Crisis', color: '#991B1B', icon: 'exclamationmark.triangle.fill' };
    }
  };

  const renderReading = ({ item }: { item: BPReading }) => {
    const category = getBPCategory(item.systolic, item.diastolic);
    
    return (
      <View style={styles.readingCard}>
        <View style={styles.readingHeader}>
          <View style={styles.readingInfo}>
            <Text style={styles.readingDate}>{formatDate(item.timestamp)}</Text>
            <Text style={styles.readingTime}>{formatTime(item.timestamp)}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: category.color + '20' }]}>
            <IconSymbol size={16} name={category.icon as any} color={category.color} />
            <Text style={[styles.categoryText, { color: category.color }]}>
              {category.category}
            </Text>
          </View>
        </View>
        
        <View style={styles.pressureContainer}>
          <View style={styles.pressureReading}>
            <Text style={styles.pressureNumber}>{item.systolic}</Text>
            <Text style={styles.pressureLabel}>SYS</Text>
          </View>
          <Text style={styles.pressureDivider}>/</Text>
          <View style={styles.pressureReading}>
            <Text style={styles.pressureNumber}>{item.diastolic}</Text>
            <Text style={styles.pressureLabel}>DIA</Text>
          </View>
          <Text style={styles.mmhgLabel}>mmHg</Text>
        </View>
        
        {item.note && (
          <View style={styles.noteContainer}>
            <IconSymbol size={16} name="note.text" color="#94A3B8" />
            <Text style={styles.noteText}>{item.note}</Text>
          </View>
        )}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <IconSymbol size={64} name="clock" color="#64748B" />
      <Text style={styles.emptyTitle}>No readings yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your blood pressure by adding your first reading.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <IconSymbol size={32} name="clock.fill" color="#60A5FA" />
        <Text style={styles.title}>Reading History</Text>
        <Text style={styles.subtitle}>
          {bpReadings.length} reading{bpReadings.length !== 1 ? 's' : ''} recorded
        </Text>
      </View>

      <FlatList
        data={bpReadings}
        renderItem={renderReading}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={EmptyState}
      />
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
    padding: 20,
    paddingBottom: 10,
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
  },
  listContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  readingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  readingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  readingInfo: {
    flex: 1,
  },
  readingDate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },      
  readingTime: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pressureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pressureReading: {
    alignItems: 'center',
  },
  pressureNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  pressureLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  pressureDivider: {
    fontSize: 28,
    color: '#64748B',
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  mmhgLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 8,
    fontWeight: '500',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 40,
  },
});
