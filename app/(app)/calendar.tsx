import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, TextInput, Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { generateId } from '../../models/taskModels';

type EventCategory = 'study' | 'exam' | 'assignment' | 'personal' | 'reminder';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  study:      '#4A90E2',
  exam:       '#F44336',
  assignment: '#FF9800',
  personal:   '#9370DB',
  reminder:   '#4CAF50',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  study:      '📚 Study',
  exam:       '📝 Exam',
  assignment: '📋 Assignment',
  personal:   '👤 Personal',
  reminder:   '🔔 Reminder',
};

interface CalEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  description?: string;
}

const EVENTS_KEY = 'calendar_events';

export default function CalendarPage() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<EventCategory>('study');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const load = useCallback(async () => {
    const json = await AsyncStorage.getItem(EVENTS_KEY);
    setEvents(json ? JSON.parse(json) : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (updated: CalEvent[]) => {
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
    setEvents(updated);
  };

  const openAdd = () => {
    setEditing(null);
    setTitle(''); setDesc(''); setCategory('study'); setStartTime(''); setEndTime('');
    setModal(true);
  };

  const openEdit = (ev: CalEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setDesc(ev.description ?? '');
    setCategory(ev.category);
    setStartTime(ev.startTime ?? '');
    setEndTime(ev.endTime ?? '');
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title.'); return; }
    if (editing) {
      const updated = events.map((e) =>
        e.id === editing.id
          ? { ...e, title: title.trim(), description: desc.trim(), category, startTime, endTime }
          : e,
      );
      await save(updated);
    } else {
      const ev: CalEvent = {
        id: generateId(),
        title: title.trim(),
        date: selectedDate,
        category,
        description: desc.trim() || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
      };
      await save([...events, ev]);
    }
    setModal(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Event', 'Remove this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => save(events.filter((e) => e.id !== id)) },
    ]);
  };

  // Build marked dates for calendar
  const markedDates: Record<string, any> = {};
  events.forEach((ev) => {
    const color = CATEGORY_COLORS[ev.category];
    if (!markedDates[ev.date]) {
      markedDates[ev.date] = { dots: [], marked: true };
    }
    markedDates[ev.date].dots.push({ color });
  });
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] ?? {}),
    selected: true,
    selectedColor: '#FFD700',
  };

  const dayEvents = events
    .filter((e) => e.date === selectedDate)
    .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

  const upcomingEvents = events
    .filter((e) => e.date >= new Date().toISOString().split('T')[0])
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const calTheme = {
    backgroundColor: theme.background,
    calendarBackground: theme.surface,
    textSectionTitleColor: theme.textSecondary,
    selectedDayBackgroundColor: '#FFD700',
    selectedDayTextColor: '#1E1E1E',
    todayTextColor: '#FFD700',
    dayTextColor: theme.text,
    textDisabledColor: theme.textSecondary + '55',
    dotColor: '#FFD700',
    selectedDotColor: '#1E1E1E',
    arrowColor: '#FFD700',
    monthTextColor: theme.text,
    indicatorColor: '#FFD700',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: theme.surface }]}>
          <Calendar
            onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={calTheme}
          />
        </View>

        {/* Selected Day Events */}
        <View style={styles.dayHeader}>
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
            <Ionicons name="add" size={20} color="#1E1E1E" />
          </TouchableOpacity>
        </View>

        {dayEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.card }]}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No events. Tap + to add one.</Text>
          </View>
        ) : (
          dayEvents.map((ev) => (
            <EventCard key={ev.id} event={ev} theme={theme} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming</Text>
            {upcomingEvents.map((ev) => (
              <EventCard key={ev.id + '_up'} event={ev} theme={theme} onEdit={openEdit} onDelete={handleDelete} showDate />
            ))}
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#2D2D2D' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>
              {editing ? 'Edit Event' : 'New Event'}
            </Text>
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
              placeholder="Event title"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD', height: 80 }]}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              value={desc}
              onChangeText={setDesc}
              multiline
            />
            {/* Category */}
            <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, { borderColor: CATEGORY_COLORS[c] }, category === c && { backgroundColor: CATEGORY_COLORS[c] }]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, category === c && { color: '#FFF' }]}>{CATEGORY_LABELS[c]}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {/* Times */}
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
                placeholder="Start (e.g. 14:00)"
                placeholderTextColor="#666"
                value={startTime}
                onChangeText={setStartTime}
              />
              <Text style={{ color: isDark ? '#FFF' : '#000', marginHorizontal: 8 }}>→</Text>
              <TextInput
                style={[styles.timeInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
                placeholder="End (e.g. 16:00)"
                placeholderTextColor="#666"
                value={endTime}
                onChangeText={setEndTime}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: CATEGORY_COLORS[category] }]} onPress={handleSave}>
                <Text style={styles.confirmBtnText}>{editing ? 'Save' : 'Add Event'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function EventCard({ event, theme, onEdit, onDelete, showDate = false }: {
  event: CalEvent;
  theme: ReturnType<typeof getTheme>;
  onEdit: (e: CalEvent) => void;
  onDelete: (id: string) => void;
  showDate?: boolean;
}) {
  const color = CATEGORY_COLORS[event.category];
  return (
    <TouchableOpacity
      style={[styles.eventCard, { backgroundColor: theme.card, borderLeftColor: color }]}
      onPress={() => onEdit(event)}
      onLongPress={() => onDelete(event.id)}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.eventTitle, { color: theme.text }]}>{event.title}</Text>
        {showDate && (
          <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
            {new Date(event.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
        )}
        {(event.startTime || event.endTime) && (
          <Text style={[styles.eventMeta, { color: theme.textSecondary }]}>
            {event.startTime}{event.endTime ? ` → ${event.endTime}` : ''}
          </Text>
        )}
        {event.description && (
          <Text style={[styles.eventDesc, { color: theme.textSecondary }]} numberOfLines={1}>
            {event.description}
          </Text>
        )}
      </View>
      <View style={[styles.categoryBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.categoryText, { color }]}>{event.category}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  calendarCard: { borderRadius: 16, overflow: 'hidden' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayTitle: { fontSize: 16, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFD700', justifyContent: 'center', alignItems: 'center' },
  emptyCard: { borderRadius: 14, padding: 24, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 8 },
  eventCard: {
    borderRadius: 12, padding: 14, borderLeftWidth: 4,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventMeta: { fontSize: 12, marginTop: 2 },
  eventDesc: { fontSize: 12, marginTop: 2 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, textAlignVertical: 'top',
  },
  label: { fontSize: 13 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, backgroundColor: 'transparent',
  },
  chipText: { fontSize: 12, color: '#888' },
  timeRow: { flexDirection: 'row', alignItems: 'center' },
  timeInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#33333366', alignItems: 'center' },
  cancelBtnText: { color: '#AAA', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
