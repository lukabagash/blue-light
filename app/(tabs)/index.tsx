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
  Text,
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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;
  const [sortDescending, setSortDescending] = useState<boolean>(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchDates = useCallback(async () => {
    const { data, error } = await supabase
      .from('test_luka')
      .select('date')
      .order('date', { ascending: false });
    if (error) {
      console.error('Error fetching dates:', error);
      return;
    }
    const unique = Array.from(new Set(data.map((d) => d.date)));
    setDates(unique);
  }, []);

  const fetchRooms = useCallback(
    async (dateFilter: string = 'All') => {
      let query = supabase
        .from('test_luka')
        .select('id, room_name, predicted_probability, date');
      if (dateFilter !== 'All') {
        query = query.eq('date', dateFilter);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        let result = data ?? [];
        // apply current sort order
        result = result.sort((a, b) =>
          sortDescending
            ? b.predicted_probability - a.predicted_probability
            : a.predicted_probability - b.predicted_probability
        );
        setRooms(result);
      }
    },
    [sortDescending]
  );

  useEffect(() => {
    setLoading(true);
    fetchDates()
      .then(() => fetchRooms('All'))
      .finally(() => setLoading(false));
  }, [fetchDates, fetchRooms]);

  const onSelectDate = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
    setLoading(true);
    fetchRooms(date).finally(() => setLoading(false));
  };

  const toggleSort = () => {
    setSortDescending((prev) => !prev);
    setCurrentPage(1);
    setRooms((prev) =>
      [...prev].sort((a, b) =>
        !sortDescending
          ? b.predicted_probability - a.predicted_probability
          : a.predicted_probability - b.predicted_probability
      )
    );
  };

  const onPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };
  const onNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <FlatList
      data={paginatedRooms}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={() => (
        <View style={styles.headerTop}>
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
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: isDark ? '#444' : '#eee' }]}
            onPress={toggleSort}
          >
            <ThemedText style={[styles.sortButtonText, { color: isDark ? '#fff' : '#000' }]}>
              Sort {sortDescending ? '↓' : '↑'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
      renderItem={({ item }) => (
        <RoomItem
          roomName={item.room_name}
          probability={Math.round(item.predicted_probability * 100)}
        />
      )}
      ListFooterComponent={() => (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            disabled={currentPage === 1}
            onPress={onPrevPage}
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
          >
            <Text style={currentPage === 1 ? styles.disabledText : styles.pageButtonText}>
              Previous
            </Text>
          </TouchableOpacity>
          <ThemedText style={styles.pageInfo}>
            {currentPage} / {totalPages}
          </ThemedText>
          <TouchableOpacity
            disabled={currentPage === totalPages}
            onPress={onNextPage}
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
          >
            <Text style={currentPage === totalPages ? styles.disabledText : styles.pageButtonText}>
              Next
            </Text>
          </TouchableOpacity>
        </View>
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
        <ThemedText style={[styles.roomText, { color: textColor }]}>{roomName}</ThemedText>
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
          <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>In Use</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, { backgroundColor: buttonBg }]}>
          <ThemedText style={[styles.buttonText, { color: buttonTextColor }]}>T/O</ThemedText>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterScroll: {
    flexGrow: 1,
    paddingRight: 8,
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
  sortButton: {
    padding: 6,
    borderRadius: 4,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  disabledText: {
    color: '#777',
  },
  pageInfo: {
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
