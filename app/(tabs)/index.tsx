// app/(tabs)/HomeScreen.tsx

import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const BATCH_SIZE = 20;

type Room = {
  id: string;
  roomNumber: number;
  percentage: number;
};

function RoomItem({ roomNumber, percentage }: Omit<Room, 'id'>) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // dynamic colors
  const cardBg = isDark ? '#333' : '#fff';
  const progressBg = isDark ? '#444' : '#eee';
  const textColor = isDark ? '#fff' : '#000';
  const buttonBg = isDark ? '#0A84FF' : '#007AFF';
  const buttonText = isDark ? '#000' : '#fff';

  // red if >50%, green otherwise (this stays the same)
  const barColor = percentage > 50 ? 'red' : 'green';

  return (
    <View style={[styles.itemContainer, { backgroundColor: cardBg }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.roomText, { color: textColor }]}>
          Room {roomNumber}
        </ThemedText>
        <ThemedText style={[styles.percentageText, { color: textColor }]}>
          {percentage}%
        </ThemedText>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${percentage}%`, backgroundColor: barColor },
          ]}
        />
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonBg }]}
        >
          <ThemedText style={[styles.buttonText, { color: buttonText }]}>
            In Use
          </ThemedText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonBg }]}
        >
          <ThemedText style={[styles.buttonText, { color: buttonText }]}>
            T/O
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [rooms, setRooms] = useState<Room[]>(
    Array.from({ length: BATCH_SIZE }, (_, i) => ({
      id: `${i + 1}`,
      roomNumber: i + 1,
      percentage: Math.floor(Math.random() * 101),
    }))
  );

  const loadMoreRooms = () => {
    const nextIndex = rooms.length;
    const newBatch = Array.from({ length: BATCH_SIZE }, (_, i) => ({
      id: `${nextIndex + i + 1}`,
      roomNumber: nextIndex + i + 1,
      percentage: Math.floor(Math.random() * 101),
    }));
    setRooms((prev) => [...prev, ...newBatch]);
  };

  return (
    <FlatList
      data={rooms}
      renderItem={({ item }) => (
        <RoomItem
          roomNumber={item.roomNumber}
          percentage={item.percentage}
        />
      )}
      keyExtractor={(item) => item.id}
      onEndReached={loadMoreRooms}
      onEndReachedThreshold={0.5}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
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
