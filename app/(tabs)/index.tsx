// app/(tabs)/HomeScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '@/lib/supabase';

type Room = {
  id: number;
  room_name: string;
  predicted_probability: number;
};

export default function HomeScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from<Room>('test_luka')
      .select('id, room_name, predicted_probability');
    if (error) {
      console.error('Error fetching rooms:', error);
    } else {
      setRooms(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <FlatList
      data={rooms}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <RoomItem
          roomName={item.room_name}
          // convert 0–1 probability to 0–100 integer
          probability={Math.round(item.predicted_probability * 100)}
        />
      )}
      contentContainerStyle={styles.listContainer}
    />
  );
}

type RoomItemProps = {
  roomName: string;
  probability: number;
};
function RoomItem({ roomName, probability }: RoomItemProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // dynamic colors
  const cardBg = isDark ? '#333' : '#fff';
  const progressBg = isDark ? '#444' : '#eee';
  const textColor = isDark ? '#fff' : '#000';
  const buttonBg = isDark ? '#0A84FF' : '#007AFF';
  const buttonTextColor = isDark ? '#000' : '#fff';

  // red if >50%, green otherwise
  const barColor = probability > 50 ? 'red' : 'green';

  return (
    <View style={[styles.itemContainer, { backgroundColor: cardBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.roomText, { color: textColor }]}>
          {roomName}
        </ThemedText>
        <ThemedText style={[styles.percentageText, { color: textColor }]}>
          {probability}%
        </ThemedText>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${probability}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonBg }]}>
          <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
            In Use
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonBg }]}>
          <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>
            T/O
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android elevation
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  roomText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  percentageText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonText: {
    fontWeight: 'bold',
  },
});
