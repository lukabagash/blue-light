// app/(tabs)/HomeScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '@/lib/supabase';

type Room = {
  id: number;
  room_name: string;
  predicted_probability: number;
  date: string; // YYYY‑MM‑DD
};

export default function HomeScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const fetchDates = useCallback(async () => {
    const { data, error } = await supabase
      .from('test_luka')
      .select<{ date: string }>('date')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching dates:', error);
      return;
    }
    // dedupe
    const unique = Array.from(new Set(data.map((d) => d.date)));
    setDates(unique);
  }, []);

  const fetchRooms = useCallback(
    async (dateFilter: string = 'All') => {
      let query = supabase
        .from('test_luka')
        .select<Room>('id, room_name, predicted_probability, date');
      if (dateFilter !== 'All') {
        query = query.eq('date', dateFilter);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        setRooms(data ?? []);
      }
    },
    []
  );

  // initial load: dates & all rooms
  useEffect(() => {
    setLoading(true);
    fetchDates()
      .then(() => fetchRooms('All'))
      .finally(() => setLoading(false));
  }, [fetchDates, fetchRooms]);

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    setLoading(true);
    fetchRooms(date).finally(() => setLoading(false));
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <FlatList
      data={rooms}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={() => (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {['All', ...dates].map((d) => {
              const active = d === selectedDate;
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.filterButton,
                    {
                      backgroundColor: active
                        ? isDark
                          ? '#0A84FF'
                          : '#007AFF'
                        : isDark
                        ? '#444'
                        : '#eee',
                    },
                  ]}
                  onPress={() => onSelectDate(d)}
                >
                  <ThemedText
                    style={[
                      styles.filterText,
                      {
                        color: active
                          ? isDark
                            ? '#000'
                            : '#fff'
                          : isDark
                          ? '#fff'
                          : '#000',
                      },
                    ]}
                  >
                    {d}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
      renderItem={({ item }) => (
        <RoomItem
          roomName={item.room_name}
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

  const cardBg = isDark ? '#333' : '#fff';
  const progressBg = isDark ? '#444' : '#eee';
  const textColor = isDark ? '#fff' : '#000';
  const buttonBg = isDark ? '#0A84FF' : '#007AFF';
  const buttonTextColor = isDark ? '#000' : '#fff';

  const barColor = probability > 50 ? 'red' : 'green';

  return (
    <View style={[styles.itemContainer, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.roomText, { color: textColor }]}>
          {roomName}
        </ThemedText>
        <ThemedText style={[styles.percentageText, { color: textColor }]}>
          {probability}%
        </ThemedText>
      </View>

      <View style={[styles.progressBar, { backgroundColor: progressBg }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${probability}%`, backgroundColor: barColor },
          ]}
        />
      </View>

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
  filterContainer: {
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemContainer: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
