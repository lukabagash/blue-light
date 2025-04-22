// app/(tabs)/HomeScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Modal,
  ScrollView,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


type Room = {
  id: number;
  room_name: string;
  predicted_probability: number;
  date: string;           // YYYY‑MM‑DD
  time: string | null;    // HH:MM:SS
};

export default function HomeScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filterOptions, setFilterOptions] = useState<{ date: string; time: string | null }[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<{ date: string; time: string | null } | null>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const insets = useSafeAreaInsets();


  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [sortDescending, setSortDescending] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // derive pagination
  const totalPages = Math.ceil(rooms.length / itemsPerPage);
  const paginatedRooms = rooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 1) fetch all distinct (date, time) combos
  const fetchFilterOptions = useCallback(async () => {
    const { data, error } = await supabase
      .from('test_luka')
      .select('date, time')
      .order('date', { ascending: false })
      .order('time', { ascending: false });

    if (error) {
      console.error('Error fetching filter options:', error);
      return;
    }
    const seen = new Set<string>();
    const combos: { date: string; time: string | null }[] = [];
    data.forEach(d => {
      const key = `${d.date} ${d.time ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        combos.push({ date: d.date, time: d.time });
      }
    });
    setFilterOptions(combos);
  }, []);

  // 2) fetch rooms, optionally filtering by date & time
  const fetchRooms = useCallback(
    async (dateFilter?: string, timeFilter?: string | null) => {
      let query = supabase
        .from('test_luka')
        .select('id, room_name, predicted_probability, date, time');

      if (dateFilter)  query = query.eq('date', dateFilter);
      if (timeFilter)  query = query.eq('time', timeFilter);

      const { data, error } = await query
        .order('date', { ascending: false })
        .order('time', { ascending: false });

      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        const list = (data || []) as Room[];
        // apply sort
        list.sort((a, b) =>
          sortDescending
            ? b.predicted_probability - a.predicted_probability
            : a.predicted_probability - b.predicted_probability
        );
        setRooms(list);
      }
    },
    [sortDescending]
  );

  // initial load: filter options + all rooms
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchFilterOptions(), fetchRooms()])
      .finally(() => setLoading(false));
  }, [fetchFilterOptions, fetchRooms]);

  // apply a (date,time) filter or clear it
  const applyFilter = (f: { date: string; time: string | null } | null) => {
    setSelectedFilter(f);
    setCurrentPage(1);
    setFilterVisible(false);
    setLoading(true);
    if (f) {
      fetchRooms(f.date, f.time).finally(() => setLoading(false));
    } else {
      fetchRooms().finally(() => setLoading(false));
    }
  };

  // toggle sort order
  const toggleSort = () => {
    setSortDescending((s) => !s);
    setCurrentPage(1);
    // re-sort current rooms immediately
    setRooms((prev) =>
      [...prev].sort((a, b) =>
        !sortDescending
          ? b.predicted_probability - a.predicted_probability
          : a.predicted_probability - b.predicted_probability
      )
    );
  };

  // pagination handlers
  const onPrevPage = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const onNextPage = () => currentPage < totalPages && setCurrentPage((p) => p + 1);

  if (loading) {
    return <ActivityIndicator style={styles.loader} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {/** Filter Modal **/}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#333' : '#fff' }]}>
            <ScrollView>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => applyFilter(null)}
              >
                <Text style={[styles.modalOptionText, { color: isDark ? '#fff' : '#000' }]}>
                  All
                </Text>
              </TouchableOpacity>
              {filterOptions.map(opt => {
                const label = `${opt.date}${opt.time ? ' ' + opt.time : ''}`;
                const active =
                  selectedFilter?.date === opt.date &&
                  selectedFilter?.time === opt.time;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.modalOption,
                      active && { backgroundColor: isDark ? '#555' : '#eee' },
                    ]}
                    onPress={() => applyFilter(opt)}
                  >
                    <Text style={[styles.modalOptionText, { color: isDark ? '#fff' : '#000' }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setFilterVisible(false)}
              style={styles.modalClose}
            >
              <Text style={{ color: isDark ? '#fff' : '#000' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/** Main List **/}
      <FlatList
        data={paginatedRooms}
        keyExtractor={i => i.id.toString()}
        ListHeaderComponent={() => (
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={[styles.filterButtonHeader, { backgroundColor: isDark ? '#444' : '#eee' }]}
              onPress={() => setFilterVisible(true)}
            >
              <ThemedText style={{ color: isDark ? '#fff' : '#000' }}>
                {selectedFilter
                  ? `${selectedFilter.date}${selectedFilter.time ? ' ' + selectedFilter.time : ''}`
                  : 'Filter'}
              </ThemedText>
            </TouchableOpacity>
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
        contentContainerStyle={[styles.listContainer, { paddingBottom: insets.bottom + 50 }]}
      />
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  filterButtonHeader: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 8,
    padding: 16,
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  modalOptionText: {
    fontSize: 16,
  },
  modalClose: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
});
