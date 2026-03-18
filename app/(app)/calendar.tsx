import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, Pressable, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { generateId } from '../../models/taskModels';
import { subscribeToEvents, upsertEvent, deleteEvent, EventCategory, CalEvent } from '../../services/calendarService';
import { scheduleEventNotification, cancelNotifications } from '../../services/notificationService';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  study:      '#2E86AB',
  exam:       '#E76F51',
  assignment: '#F4A261',
  personal:   '#9381FF',
  reminder:   '#52B788',
};

const CATEGORY_LABELS: Record<EventCategory, string> = {
  study:      '📚 Study',
  exam:       '📝 Exam',
  assignment: '📋 Assignment',
  personal:   '👤 Personal',
  reminder:   '🔔 Reminder',
};

// ── Time Picker ────────────────────────────────────────

function TimePickerField({ label, value, onChange, isDark }: {
  label: string; value: string; onChange: (v: string) => void; isDark: boolean;
}) {
  const hour   = value ? parseInt(value.split(':')[0]) : null;
  const minute = value ? parseInt(value.split(':')[1]) : 0;

  const emit = (h: number, m: number) =>
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);

  const adjustH = (delta: number) => {
    const h = hour === null ? 8 : hour;
    emit(((h + delta + 24) % 24), minute);
  };
  const adjustM = (delta: number) => {
    const h = hour === null ? 8 : hour;
    emit(h, ((minute + delta * 5 + 60) % 60));
  };

  const textColor    = isDark ? '#E8F4FD' : '#142030';
  const subtleColor  = isDark ? '#7AAFC8' : '#5A7E9B';
  const borderColor  = isDark ? '#2A3F56' : '#CAE0F0';
  const bgColor      = isDark ? '#0A1524' : '#F5FAFF';

  return (
    <View style={{ flex: 1 }}>
      <Text style={[tp.label, { color: subtleColor }]}>{label}</Text>
      {hour === null ? (
        <TouchableOpacity
          style={[tp.setBtn, { borderColor }]}
          onPress={() => emit(8, 0)}
        >
          <Ionicons name="time-outline" size={14} color={subtleColor} />
          <Text style={{ color: subtleColor, fontSize: 13 }}>Set time</Text>
        </TouchableOpacity>
      ) : (
        <View style={[tp.picker, { borderColor, backgroundColor: bgColor }]}>
          <View style={tp.col}>
            <TouchableOpacity onPress={() => adjustH(1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="chevron-up" size={16} color={subtleColor} />
            </TouchableOpacity>
            <Text style={[tp.digit, { color: textColor }]}>{String(hour).padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => adjustH(-1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="chevron-down" size={16} color={subtleColor} />
            </TouchableOpacity>
          </View>
          <Text style={[tp.colon, { color: subtleColor }]}>:</Text>
          <View style={tp.col}>
            <TouchableOpacity onPress={() => adjustM(1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="chevron-up" size={16} color={subtleColor} />
            </TouchableOpacity>
            <Text style={[tp.digit, { color: textColor }]}>{String(minute).padStart(2, '0')}</Text>
            <TouchableOpacity onPress={() => adjustM(-1)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="chevron-down" size={16} color={subtleColor} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => onChange('')} style={{ marginLeft: 6 }} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close-circle" size={18} color={subtleColor} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const tp = StyleSheet.create({
  label:  { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  setBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, padding: 10, borderStyle: 'dashed' },
  picker: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  col:    { alignItems: 'center', gap: 2 },
  digit:  { fontSize: 20, fontWeight: '700', minWidth: 28, textAlign: 'center' },
  colon:  { fontSize: 20, fontWeight: '700', marginHorizontal: 2 },
});

export default function CalendarPage() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const { user } = useAuth();
  const uid = user?.uid ?? 'guest';

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [snackbar, setSnackbar] = useState<{ message: string; undoFn: () => void } | null>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState<EventCategory>('study');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [showTimeSection, setShowTimeSection] = useState(false);
  const [showDescSection, setShowDescSection] = useState(false);

  useEffect(() => subscribeToEvents(setEvents), []);

  const persist = async (updated: CalEvent[], removed?: CalEvent[]) => {
    await Promise.all([
      ...updated.map((ev) => upsertEvent(ev)),
      ...(removed ?? []).map((ev) => deleteEvent(ev.id)),
    ]);
  };

  const openAdd = () => {
    setEditing(null);
    setTitle(''); setDesc(''); setCategory('study'); setStartTime(''); setEndTime('');
    setShowTimeSection(false); setShowDescSection(false);
    setModal(true);
  };

  const openEdit = (ev: CalEvent) => {
    setEditing(ev);
    setTitle(ev.title);
    setDesc(ev.description ?? '');
    setCategory(ev.category);
    setStartTime(ev.startTime ?? '');
    setEndTime(ev.endTime ?? '');
    setShowTimeSection(!!(ev.startTime || ev.endTime));
    setShowDescSection(!!ev.description);
    setModal(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title.'); return; }
    if (editing) {
      const ev: CalEvent = { ...editing, title: title.trim(), description: desc.trim() || undefined, category, startTime: startTime || undefined, endTime: endTime || undefined };
      await upsertEvent(ev);
      if (!editing.taskId) {
        await scheduleEventNotification(uid, ev.id, ev.title, ev.date, ev.startTime);
      }
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
      await upsertEvent(ev);
      await scheduleEventNotification(uid, ev.id, ev.title, ev.date, ev.startTime);
    }
    setModal(false);
  };

  const showSnackbar = (message: string, undoFn: () => void) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbar({ message, undoFn });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const handleDelete = async (id: string) => {
    const previous = [...events];
    const removed = events.filter((e) => e.id === id);
    await persist(events.filter((e) => e.id !== id), removed);
    await cancelNotifications(uid, id);
    showSnackbar('Event deleted', async () => {
      await persist(previous);
      const ev = previous.find((e) => e.id === id);
      if (ev && !ev.taskId) await scheduleEventNotification(uid, ev.id, ev.title, ev.date, ev.startTime);
    });
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
    selectedColor: '#3DBDAA',
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
    selectedDayBackgroundColor: '#3DBDAA',
    selectedDayTextColor: '#0D1B2A',
    todayTextColor: '#3DBDAA',
    dayTextColor: theme.text,
    textDisabledColor: theme.textSecondary + '55',
    dotColor: '#3DBDAA',
    selectedDotColor: '#0D1B2A',
    arrowColor: '#3DBDAA',
    monthTextColor: theme.text,
    indicatorColor: '#3DBDAA',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Calendar */}
        <View style={[styles.calendarCard, { backgroundColor: theme.surface }]}>
          <Calendar
            key={isDark ? 'dark' : 'light'}
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
            <Ionicons name="add" size={20} color="#0D1B2A" />
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

      {/* Snackbar */}
      {snackbar && (
        <View style={[styles.snackbar, { backgroundColor: isDark ? '#1E3A54' : '#142030' }]}>
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
          <TouchableOpacity onPress={() => { snackbar.undoFn(); setSnackbar(null); }}>
            <Text style={styles.snackbarUndo}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
            <Pressable style={[styles.modalCard, { backgroundColor: isDark ? '#152234' : '#FFF' }]}>
              {/* Handle */}
              <View style={styles.sheetHandle} />

              <Text style={[styles.modalTitle, { color: isDark ? '#E8F4FD' : '#142030' }]}>
                {editing ? 'Edit Event' : 'New Event'}
              </Text>

              {/* Title */}
              <TextInput
                style={[styles.input, { color: isDark ? '#E8F4FD' : '#142030', borderColor: isDark ? '#2A3F56' : '#CAE0F0' }]}
                placeholder="Event title"
                placeholderTextColor={isDark ? '#456B84' : '#8AAABB'}
                value={title}
                onChangeText={setTitle}
                autoFocus={!editing}
              />

              {/* Category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginHorizontal: -4 }}>
                <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4, paddingVertical: 2 }}>
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

              {/* Time toggle row */}
              <TouchableOpacity
                style={[styles.expandRow, { borderColor: isDark ? '#2A3F56' : '#CAE0F0' }]}
                onPress={() => {
                  if (showTimeSection) { setStartTime(''); setEndTime(''); }
                  setShowTimeSection((v) => !v);
                }}
              >
                <Ionicons name="time-outline" size={16} color={isDark ? '#7AAFC8' : '#5A7E9B'} />
                <Text style={[styles.expandLabel, { color: isDark ? '#7AAFC8' : '#5A7E9B' }]}>
                  {startTime || endTime
                    ? `${startTime || '—'}${endTime ? ` → ${endTime}` : ''}`
                    : 'Add time'}
                </Text>
                <Ionicons
                  name={showTimeSection ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={isDark ? '#456B84' : '#8AAABB'}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
              {showTimeSection && (
                <View style={styles.timeRow}>
                  <TimePickerField label="Start" value={startTime} onChange={setStartTime} isDark={isDark} />
                  <Text style={{ color: isDark ? '#7AAFC8' : '#5A7E9B', marginHorizontal: 8, marginTop: 20, alignSelf: 'center' }}>→</Text>
                  <TimePickerField label="End" value={endTime} onChange={setEndTime} isDark={isDark} />
                </View>
              )}

              {/* Description toggle row */}
              <TouchableOpacity
                style={[styles.expandRow, { borderColor: isDark ? '#2A3F56' : '#CAE0F0' }]}
                onPress={() => {
                  if (showDescSection) setDesc('');
                  setShowDescSection((v) => !v);
                }}
              >
                <Ionicons name="document-text-outline" size={16} color={isDark ? '#7AAFC8' : '#5A7E9B'} />
                <Text style={[styles.expandLabel, { color: isDark ? '#7AAFC8' : '#5A7E9B' }]} numberOfLines={1}>
                  {desc.trim() ? desc.trim() : 'Add description'}
                </Text>
                <Ionicons
                  name={showDescSection ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={isDark ? '#456B84' : '#8AAABB'}
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>
              {showDescSection && (
                <TextInput
                  style={[styles.input, { color: isDark ? '#E8F4FD' : '#142030', borderColor: isDark ? '#2A3F56' : '#CAE0F0', height: 72, marginTop: 0 }]}
                  placeholder="Description"
                  placeholderTextColor={isDark ? '#456B84' : '#8AAABB'}
                  value={desc}
                  onChangeText={setDesc}
                  multiline
                  autoFocus
                />
              )}

              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: CATEGORY_COLORS[category] }]} onPress={handleSave}>
                  <Text style={styles.confirmBtnText}>{editing ? 'Save' : 'Add Event'}</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
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
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3DBDAA', justifyContent: 'center', alignItems: 'center' },
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
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, gap: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A3F5666', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, textAlignVertical: 'top',
  },
  label: { fontSize: 13 },
  expandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
  },
  expandLabel: { fontSize: 14, flex: 1 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, backgroundColor: 'transparent',
  },
  chipText: { fontSize: 12, color: '#7AAFC8' },
  timeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  modalBtns: { flexDirection: 'row', gap: 12 },
  snackbar: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  snackbarText: { color: '#fff', fontSize: 14, flex: 1 },
  snackbarUndo: { color: '#3DBDAA', fontSize: 14, fontWeight: '700', marginLeft: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2A3F5644', alignItems: 'center' },
  cancelBtnText: { color: '#7AAFC8', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontWeight: '700' },
});
