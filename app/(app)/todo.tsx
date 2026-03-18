import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
  KeyboardAvoidingView, Platform, Pressable, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { Task, TaskList, TaskPriority, Subtask, Note, RepeatInterval, generateId, priorityColor } from '../../models/taskModels';
import * as taskService from '../../services/taskService';
import { logTaskCompletion } from '../../services/studyStatsService';
import { scheduleTaskNotifications, cancelNotifications } from '../../services/notificationService';
import { upsertTaskEvent, removeTaskEvent } from '../../services/calendarService';

const LIST_COLORS = ['#2E86AB', '#3DBDAA', '#9381FF', '#52B788', '#F4A261', '#E76F51', '#7AAFC8'];
const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high'];

type View_ = 'lists' | 'tasks';

function getNextDueDate(dueDate: string, interval: RepeatInterval): string {
  const d = new Date(dueDate + 'T12:00:00');
  if (interval === 'daily') d.setDate(d.getDate() + 1);
  else if (interval === 'weekly') d.setDate(d.getDate() + 7);
  else if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

export default function TodoPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [view, setView] = useState<View_>('lists');
  const [lists, setLists] = useState<TaskList[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskCountMap, setTaskCountMap] = useState<Record<string, number>>({});
  const [activeList, setActiveList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // List modal
  const [listModal, setListModal] = useState(false);
  const [listTitle, setListTitle] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [listColor, setListColor] = useState(LIST_COLORS[0]);

  // Task modal
  const [taskModal, setTaskModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('none');
  const [taskDue, setTaskDue] = useState('');
  const [taskRepeat, setTaskRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [taskSubtasks, setTaskSubtasks] = useState<Subtask[]>([]);
  const [taskNotes, setTaskNotes] = useState<Note[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newNote, setNewNote] = useState('');
  const [taskEstHours, setTaskEstHours] = useState(0);
  const [taskEstMinutes, setTaskEstMinutes] = useState(0);
  // Section expansion
  const [showDueSection, setShowDueSection] = useState(false);
  const [showRepeatSection, setShowRepeatSection] = useState(false);
  const [showEstSection, setShowEstSection] = useState(false);
  const [showDescSection, setShowDescSection] = useState(false);
  const [showSubtaskSection, setShowSubtaskSection] = useState(false);
  const [showNoteSection, setShowNoteSection] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ message: string; undoFn: () => void } | null>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Real-time subscriptions
  useEffect(() => {
    if (!uid) return;
    const unsubLists = taskService.subscribeToLists(uid, setLists);
    const unsubTasks = taskService.subscribeToAllTasks(uid, setAllTasks);
    return () => { unsubLists(); unsubTasks(); };
  }, [uid]);

  // Derive taskCountMap from lists + allTasks
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const list of lists) {
      counts[list.id] = allTasks.filter((t) => t.listId === list.id && !t.completed).length;
    }
    setTaskCountMap(counts);
  }, [lists, allTasks]);

  // Derive tasks for active list
  useEffect(() => {
    if (activeList) {
      setTasks(allTasks.filter((t) => t.listId === activeList.id));
    }
  }, [allTasks, activeList]);

  const openList = (list: TaskList) => {
    setActiveList(list);
    setView('tasks');
  };

  const handleAddList = async () => {
    if (!listTitle.trim()) { Alert.alert('Error', 'Please enter a list name.'); return; }
    const list: TaskList = {
      id: generateId(),
      title: listTitle.trim(),
      description: listDesc.trim() || undefined,
      category: 'Study',
      createdAt: new Date().toISOString(),
      tasks: [],
      color: listColor,
      icon: 'folder',
    };
    await taskService.addList(uid, list);
    setListModal(false);
    setListTitle(''); setListDesc('');
  };

  const handleDeleteList = (id: string) => {
    Alert.alert('Delete List', 'This will delete all tasks in this list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await taskService.deleteList(uid, id);
        },
      },
    ]);
  };

  const showSnackbar = (message: string, undoFn: () => void) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbar({ message, undoFn });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const resetTaskForm = () => {
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('none');
    setTaskDue(''); setTaskRepeat('none');
    setTaskSubtasks([]); setTaskNotes([]);
    setNewSubtask(''); setNewNote('');
    setTaskEstHours(0); setTaskEstMinutes(0);
    setShowDueSection(false); setShowRepeatSection(false);
    setShowEstSection(false); setShowDescSection(false);
    setShowSubtaskSection(false); setShowNoteSection(false);
  };

  const openAddTask = () => {
    setEditTask(null);
    resetTaskForm();
    setTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description ?? '');
    setTaskPriority(task.priority);
    setTaskDue(task.dueDate ?? '');
    setTaskRepeat((task.repeatInterval as 'none' | 'daily' | 'weekly') ?? 'none');
    setTaskSubtasks(task.subtasks ?? []);
    setTaskNotes(task.notes ?? []);
    setNewSubtask(''); setNewNote('');
    setTaskEstHours(task.estimatedHours ?? 0);
    setTaskEstMinutes(task.estimatedMinutes ?? 0);
    setShowDueSection(!!task.dueDate);
    setShowRepeatSection((task.repeatInterval ?? 'none') !== 'none');
    setShowEstSection((task.estimatedHours ?? 0) > 0 || (task.estimatedMinutes ?? 0) > 0);
    setShowDescSection(!!task.description);
    setShowSubtaskSection((task.subtasks?.length ?? 0) > 0);
    setShowNoteSection((task.notes?.length ?? 0) > 0);
    setTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) { Alert.alert('Error', 'Please enter a task title.'); return; }
    if (!activeList) return;

    if (editTask) {
      const updated: Task = {
        ...editTask,
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        priority: taskPriority,
        dueDate: taskDue || undefined,
        repeatInterval: taskRepeat,
        subtasks: taskSubtasks,
        notes: taskNotes,
        estimatedHours: taskEstHours,
        estimatedMinutes: taskEstMinutes,
      };
      await taskService.updateTask(uid, updated);
      if (taskDue) {
        await scheduleTaskNotifications(uid, editTask.id, taskTitle.trim(), taskDue);
        await upsertTaskEvent(editTask.id, taskTitle.trim(), taskDue);
      } else {
        await cancelNotifications(uid, editTask.id);
        await removeTaskEvent(editTask.id);
      }
    } else {
      const task: Task = {
        id: generateId(),
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        category: 'Study',
        priority: taskPriority,
        completed: false,
        progressState: 'notStarted',
        createdAt: new Date().toISOString(),
        dueDate: taskDue || undefined,
        estimatedHours: taskEstHours,
        estimatedMinutes: taskEstMinutes,
        repeatInterval: taskRepeat,
        listId: activeList.id,
        subtasks: taskSubtasks,
        notes: taskNotes,
      };
      await taskService.addTask(uid, task);
      if (taskDue) {
        await scheduleTaskNotifications(uid, task.id, task.title, taskDue);
        await upsertTaskEvent(task.id, task.title, taskDue);
      }
    }
    setTaskModal(false);
  };

  const toggleTask = async (task: Task) => {
    const markingComplete = !task.completed;
    await taskService.updateTask(uid, {
      ...task,
      completed: markingComplete,
      progressState: markingComplete ? 'done' : 'notStarted',
      lastCompleted: markingComplete ? new Date().toISOString() : task.lastCompleted,
    });

    if (markingComplete) {
      logTaskCompletion(uid, task.id);

      // ── Recurring tasks: spawn next occurrence ──
      if (task.repeatInterval && task.repeatInterval !== 'none') {
        const base = task.dueDate ?? new Date().toISOString().split('T')[0];
        const nextDue = getNextDueDate(base, task.repeatInterval as RepeatInterval);
        const nextTask: Task = {
          ...task,
          id: generateId(),
          completed: false,
          progressState: 'notStarted',
          createdAt: new Date().toISOString(),
          dueDate: nextDue,
          lastCompleted: undefined,
          subtasks: task.subtasks.map((s) => ({ ...s, completed: false })),
          notes: [],
        };
        await taskService.addTask(uid, nextTask);
        await scheduleTaskNotifications(uid, nextTask.id, nextTask.title, nextDue);
        await upsertTaskEvent(nextTask.id, nextTask.title, nextDue);
      }
    }

  };

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await taskService.deleteTask(uid, id);
    await cancelNotifications(uid, id);
    await removeTaskEvent(id);
    showSnackbar('Task deleted', async () => {
      await taskService.addTask(uid, task);
      if (task.dueDate) {
        await scheduleTaskNotifications(uid, task.id, task.title, task.dueDate);
        await upsertTaskEvent(task.id, task.title, task.dueDate);
      }
    });
  };

  // ── Subtask helpers ──
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const st: Subtask = {
      id: generateId(),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      order: taskSubtasks.length,
    };
    setTaskSubtasks([...taskSubtasks, st]);
    setNewSubtask('');
  };

  const toggleSubtask = (id: string) =>
    setTaskSubtasks(taskSubtasks.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));

  const deleteSubtask = (id: string) =>
    setTaskSubtasks(taskSubtasks.filter((s) => s.id !== id));

  // ── Note helpers ──
  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: generateId(),
      content: newNote.trim(),
      createdAt: new Date().toISOString(),
      isPinned: false,
    };
    setTaskNotes([...taskNotes, note]);
    setNewNote('');
  };

  const deleteNote = (id: string) =>
    setTaskNotes(taskNotes.filter((n) => n.id !== id));

  // ── LISTS VIEW ──
  if (view === 'lists') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.topTitle, { color: theme.text }]}>My Lists</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => { setListTitle(''); setListDesc(''); setListColor(LIST_COLORS[0]); setListModal(true); }}>
            <Ionicons name="add" size={20} color="#1E1E1E" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll}>
          {lists.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>📝</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No lists yet. Tap + to create one!</Text>
            </View>
          ) : (
            lists.map((list) => {
              const taskCount = taskCountMap[list.id] ?? 0;
              return (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.listCard, { backgroundColor: theme.card, borderLeftColor: list.color }]}
                  onPress={() => openList(list)}
                  onLongPress={() => handleDeleteList(list.id)}
                >
                  <View style={[styles.listIconCircle, { backgroundColor: list.color + '22' }]}>
                    <Ionicons name="folder" size={22} color={list.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listTitle, { color: theme.text }]}>{list.title}</Text>
                    {list.description && (
                      <Text style={[styles.listDesc, { color: theme.textSecondary }]} numberOfLines={1}>{list.description}</Text>
                    )}
                  </View>
                  <View style={[styles.countBadge, { backgroundColor: list.color + '22' }]}>
                    <Text style={[styles.countText, { color: list.color }]}>{taskCount}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        <Modal visible={listModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
              <Pressable style={[styles.modalCard, { backgroundColor: isDark ? '#2D2D2D' : '#FFF' }]}>
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>New List</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
                  placeholder="List name"
                  placeholderTextColor="#666"
                  value={listTitle}
                  onChangeText={setListTitle}
                />
                <TextInput
                  style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
                  placeholder="Description (optional)"
                  placeholderTextColor="#666"
                  value={listDesc}
                  onChangeText={setListDesc}
                />
                <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Color</Text>
                <View style={styles.colorRow}>
                  {LIST_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.colorDot, { backgroundColor: c }, listColor === c && styles.colorDotActive]}
                      onPress={() => setListColor(c)}
                    />
                  ))}
                </View>
                <View style={styles.modalBtns}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setListModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleAddList}>
                    <Text style={styles.confirmBtnText}>Create List</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Pressable>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── TASKS VIEW ──
  const completed = tasks.filter((t) => t.completed);
  const pending = tasks.filter((t) => !t.completed);
  const inputStyle = [styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => setView('lists')} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={[styles.listColorBar, { backgroundColor: activeList?.color }]} />
        <Text style={[styles.topTitle, { color: theme.text }]}>{activeList?.title}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAddTask}>
          <Ionicons name="add" size={20} color="#1E1E1E" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48 }}>✅</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No tasks yet. Tap + to add one!</Text>
          </View>
        )}

        {pending.map((task) => (
          <TaskCard key={task.id} task={task} theme={theme} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} />
        ))}

        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Completed ({completed.length})</Text>
            {completed.map((task) => (
              <TaskCard key={task.id} task={task} theme={theme} onToggle={toggleTask} onEdit={openEditTask} onDelete={deleteTask} />
            ))}
          </>
        )}
      </ScrollView>

      {snackbar && (
        <View style={[styles.snackbar, { backgroundColor: isDark ? '#1E3A54' : '#142030' }]}>
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
          <TouchableOpacity onPress={() => { snackbar.undoFn(); setSnackbar(null); }}>
            <Text style={styles.snackbarUndo}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Task Modal ── */}
      <Modal visible={taskModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Pressable style={styles.modalOverlay} onPress={Keyboard.dismiss}>
            <Pressable style={[styles.modalCard, { backgroundColor: isDark ? '#2D2D2D' : '#FFF' }]}>
              <View style={styles.sheetHandle} />
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>
                  {editTask ? 'Edit Task' : 'New Task'}
                </Text>

                {/* Title */}
                <TextInput
                  style={inputStyle}
                  placeholder="Task title"
                  placeholderTextColor="#666"
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  autoFocus={!editTask}
                />

                {/* Priority chips */}
                <View style={[styles.priorityRow, { marginBottom: 8 }]}>
                  {PRIORITIES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.priorityBtn, { borderColor: priorityColor(p) }, taskPriority === p && { backgroundColor: priorityColor(p) }]}
                      onPress={() => setTaskPriority(p)}
                    >
                      <Text style={[styles.priorityText, taskPriority === p && { color: '#FFF' }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* ── Due date ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD' }]}
                  onPress={() => { if (showDueSection) setTaskDue(''); setShowDueSection((v) => !v); }}
                >
                  <Ionicons name="calendar-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]}>
                    {taskDue
                      ? new Date(taskDue + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : 'Add due date'}
                  </Text>
                  <Ionicons name={showDueSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showDueSection && (
                  <Calendar
                    key={isDark ? 'dark' : 'light'}
                    current={taskDue || new Date().toISOString().split('T')[0]}
                    minDate={new Date().toISOString().split('T')[0]}
                    onDayPress={(day: { dateString: string }) => setTaskDue(day.dateString)}
                    markedDates={taskDue ? { [taskDue]: { selected: true, selectedColor: '#3DBDAA' } } : {}}
                    style={{ borderRadius: 12, overflow: 'hidden', marginTop: 6 }}
                    theme={{
                      backgroundColor: isDark ? '#1A2C3D' : '#F7FBFF',
                      calendarBackground: isDark ? '#1A2C3D' : '#F7FBFF',
                      textSectionTitleColor: isDark ? '#7AAFC8' : '#5A7E9B',
                      selectedDayBackgroundColor: '#3DBDAA',
                      selectedDayTextColor: '#0D1B2A',
                      todayTextColor: '#3DBDAA',
                      dayTextColor: isDark ? '#E8F4FF' : '#142030',
                      textDisabledColor: isDark ? '#3A4F60' : '#C0D0E0',
                      monthTextColor: isDark ? '#E8F4FF' : '#142030',
                      arrowColor: '#3DBDAA',
                    }}
                  />
                )}

                {/* ── Repeat ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD', marginTop: 8 }]}
                  onPress={() => { if (showRepeatSection) setTaskRepeat('none'); setShowRepeatSection((v) => !v); }}
                >
                  <Ionicons name="repeat-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]}>
                    {taskRepeat !== 'none' ? `Repeats ${taskRepeat}` : 'No repeat'}
                  </Text>
                  <Ionicons name={showRepeatSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showRepeatSection && (
                  <View style={[styles.priorityRow, { marginTop: 8 }]}>
                    {(['none', 'daily', 'weekly'] as const).map((r) => (
                      <TouchableOpacity
                        key={r}
                        style={[styles.priorityBtn, { borderColor: '#3DBDAA' }, taskRepeat === r && { backgroundColor: '#3DBDAA' }]}
                        onPress={() => setTaskRepeat(r)}
                      >
                        <Text style={[styles.priorityText, taskRepeat === r && { color: '#0D1B2A' }]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* ── Estimated Time ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD', marginTop: 8 }]}
                  onPress={() => { if (showEstSection) { setTaskEstHours(0); setTaskEstMinutes(0); } setShowEstSection((v) => !v); }}
                >
                  <Ionicons name="time-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]}>
                    {taskEstHours > 0 || taskEstMinutes > 0
                      ? `${taskEstHours > 0 ? `${taskEstHours}h ` : ''}${taskEstMinutes > 0 ? `${taskEstMinutes}m` : ''}`.trim()
                      : 'Add estimate'}
                  </Text>
                  <Ionicons name={showEstSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showEstSection && (
                  <View style={[styles.estRow, { marginTop: 8 }]}>
                    <View style={styles.estField}>
                      <TouchableOpacity style={styles.estBtn} onPress={() => setTaskEstHours(Math.max(0, taskEstHours - 1))}>
                        <Ionicons name="remove" size={16} color={isDark ? '#CCC' : '#444'} />
                      </TouchableOpacity>
                      <Text style={[styles.estValue, { color: isDark ? '#FFF' : '#000' }]}>{taskEstHours}h</Text>
                      <TouchableOpacity style={styles.estBtn} onPress={() => setTaskEstHours(Math.min(24, taskEstHours + 1))}>
                        <Ionicons name="add" size={16} color={isDark ? '#CCC' : '#444'} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.estField}>
                      <TouchableOpacity style={styles.estBtn} onPress={() => setTaskEstMinutes(Math.max(0, taskEstMinutes - 5))}>
                        <Ionicons name="remove" size={16} color={isDark ? '#CCC' : '#444'} />
                      </TouchableOpacity>
                      <Text style={[styles.estValue, { color: isDark ? '#FFF' : '#000' }]}>{taskEstMinutes}m</Text>
                      <TouchableOpacity style={styles.estBtn} onPress={() => setTaskEstMinutes((taskEstMinutes + 5) % 60)}>
                        <Ionicons name="add" size={16} color={isDark ? '#CCC' : '#444'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── Description ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD', marginTop: 8 }]}
                  onPress={() => { if (showDescSection) setTaskDesc(''); setShowDescSection((v) => !v); }}
                >
                  <Ionicons name="document-text-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]} numberOfLines={1}>
                    {taskDesc.trim() || 'Add description'}
                  </Text>
                  <Ionicons name={showDescSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showDescSection && (
                  <TextInput
                    style={[inputStyle, { height: 64, marginTop: 8 }]}
                    placeholder="Description"
                    placeholderTextColor="#666"
                    value={taskDesc}
                    onChangeText={setTaskDesc}
                    multiline
                    autoFocus
                  />
                )}

                {/* ── Subtasks ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD', marginTop: 8 }]}
                  onPress={() => setShowSubtaskSection((v) => !v)}
                >
                  <Ionicons name="checkbox-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]}>
                    {taskSubtasks.length > 0 ? `Subtasks (${taskSubtasks.filter((s) => s.completed).length}/${taskSubtasks.length})` : 'Add subtasks'}
                  </Text>
                  <Ionicons name={showSubtaskSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showSubtaskSection && (
                  <View style={{ marginTop: 6, gap: 2 }}>
                    {taskSubtasks.map((s) => (
                      <View key={s.id} style={styles.subtaskRow}>
                        <TouchableOpacity onPress={() => toggleSubtask(s.id)}>
                          <Ionicons name={s.completed ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={s.completed ? '#4CAF50' : (isDark ? '#888' : '#AAA')} />
                        </TouchableOpacity>
                        <Text style={[styles.subtaskText, { color: isDark ? '#CCC' : '#333', textDecorationLine: s.completed ? 'line-through' : 'none' }]}>
                          {s.title}
                        </Text>
                        <TouchableOpacity onPress={() => deleteSubtask(s.id)}>
                          <Ionicons name="close" size={16} color={isDark ? '#666' : '#AAA'} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.addRow}>
                      <TextInput
                        style={[styles.addRowInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
                        placeholder="Add subtask…"
                        placeholderTextColor="#888"
                        value={newSubtask}
                        onChangeText={setNewSubtask}
                        onSubmitEditing={addSubtask}
                        returnKeyType="done"
                      />
                      <TouchableOpacity style={styles.addRowBtn} onPress={addSubtask}>
                        <Ionicons name="add" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ── Notes ── */}
                <TouchableOpacity
                  style={[styles.expandRow, { borderColor: isDark ? '#444' : '#DDD', marginTop: 8 }]}
                  onPress={() => setShowNoteSection((v) => !v)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={isDark ? '#AAA' : '#666'} />
                  <Text style={[styles.expandLabel, { color: isDark ? '#AAA' : '#666' }]}>
                    {taskNotes.length > 0 ? `Notes (${taskNotes.length})` : 'Add notes'}
                  </Text>
                  <Ionicons name={showNoteSection ? 'chevron-up' : 'chevron-down'} size={14} color={isDark ? '#666' : '#AAA'} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
                {showNoteSection && (
                  <View style={{ marginTop: 6, gap: 4 }}>
                    {taskNotes.map((n) => (
                      <View key={n.id} style={[styles.noteCard, { backgroundColor: isDark ? '#1A1A1A' : '#F5F5F5' }]}>
                        <Text style={[styles.noteText, { color: isDark ? '#CCC' : '#333' }]}>{n.content}</Text>
                        <TouchableOpacity onPress={() => deleteNote(n.id)}>
                          <Ionicons name="close" size={16} color={isDark ? '#666' : '#AAA'} />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <View style={styles.addRow}>
                      <TextInput
                        style={[styles.addRowInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD', height: 52 }]}
                        placeholder="Add note…"
                        placeholderTextColor="#888"
                        value={newNote}
                        onChangeText={setNewNote}
                        multiline
                      />
                      <TouchableOpacity style={[styles.addRowBtn, { alignSelf: 'flex-end' }]} onPress={addNote}>
                        <Ionicons name="add" size={18} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Action buttons */}
                <View style={[styles.modalBtns, { marginTop: 16 }]}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setTaskModal(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveTask}>
                    <Text style={styles.confirmBtnText}>{editTask ? 'Save' : 'Add Task'}</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function TaskCard({ task, theme, onToggle, onEdit, onDelete }: {
  task: Task;
  theme: ReturnType<typeof getTheme>;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (id: string) => void;
}) {
  const pColor = priorityColor(task.priority);
  return (
    <TouchableOpacity
      style={[styles.taskCard, { backgroundColor: theme.card, opacity: task.completed ? 0.6 : 1 }]}
      onPress={() => onEdit(task)}
      onLongPress={() => onDelete(task.id)}
    >
      <TouchableOpacity onPress={() => onToggle(task)} style={styles.checkbox}>
        {task.completed
          ? <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          : <Ionicons name="ellipse-outline" size={24} color={theme.textSecondary} />}
      </TouchableOpacity>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.taskTitle, { color: theme.text, textDecorationLine: task.completed ? 'line-through' : 'none' }]}>
          {task.title}
        </Text>
        {task.description && (
          <Text style={[styles.taskDesc, { color: theme.textSecondary }]} numberOfLines={1}>{task.description}</Text>
        )}
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {task.priority !== 'none' && (
            <View style={[styles.tag, { backgroundColor: pColor + '22' }]}>
              <Text style={[styles.tagText, { color: pColor }]}>{task.priority}</Text>
            </View>
          )}
          {task.dueDate && (
            <View style={[styles.tag, { backgroundColor: '#4A90E222' }]}>
              <Text style={[styles.tagText, { color: '#4A90E2' }]}>Due {task.dueDate}</Text>
            </View>
          )}
          {task.subtasks && task.subtasks.length > 0 && (
            <View style={[styles.tag, { backgroundColor: '#44444433' }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length} subtasks
              </Text>
            </View>
          )}
          {task.repeatInterval && task.repeatInterval !== 'none' && (
            <View style={[styles.tag, { backgroundColor: '#3DBDAA22' }]}>
              <Text style={[styles.tagText, { color: '#3DBDAA' }]}>↻ {task.repeatInterval}</Text>
            </View>
          )}
          {task.notes && task.notes.length > 0 && (
            <View style={[styles.tag, { backgroundColor: '#9381FF22' }]}>
              <Text style={[styles.tagText, { color: '#9381FF' }]}>📝 {task.notes.length}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8,
  },
  topTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#3DBDAA', justifyContent: 'center', alignItems: 'center' },
  listColorBar: { width: 4, height: 20, borderRadius: 2 },
  scroll: { padding: 16, gap: 10, paddingBottom: 32 },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  listCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 14, borderLeftWidth: 4,
  },
  listIconCircle: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  listTitle: { fontSize: 16, fontWeight: '600' },
  listDesc: { fontSize: 13, marginTop: 2 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 13, fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  taskCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12 },
  checkbox: { paddingTop: 1 },
  taskTitle: { fontSize: 15, fontWeight: '600' },
  taskDesc: { fontSize: 13 },
  tag: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  tagText: { fontSize: 11, fontWeight: '600' },
  priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  priorityBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5, alignItems: 'center' },
  priorityText: { fontSize: 12, fontWeight: '600', color: '#7AAFC8' },
  colorRow: { flexDirection: 'row', gap: 10 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 3, borderColor: '#FFF' },
  // Snackbar
  snackbar: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 8,
  },
  snackbarText: { color: '#fff', fontSize: 14, flex: 1 },
  snackbarUndo: { color: '#3DBDAA', fontSize: 14, fontWeight: '700', marginLeft: 12 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, maxHeight: '92%' },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2A3F5666', alignSelf: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, textAlignVertical: 'top',
  },
  label: { fontSize: 13, marginBottom: 4 },
  expandRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
  },
  expandLabel: { fontSize: 14, flex: 1 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#33333366', alignItems: 'center' },
  cancelBtnText: { color: '#AAA', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#3DBDAA', alignItems: 'center' },
  confirmBtnText: { color: '#0D1B2A', fontWeight: '700' },
  // Subtasks & Notes
  subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  subtaskText: { flex: 1, fontSize: 14 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  addRowInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14 },
  addRowBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#3DBDAA', justifyContent: 'center', alignItems: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 8 },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
  // Estimated time
  estRow: { flexDirection: 'row', gap: 12 },
  estField: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 10, borderColor: '#3DBDAA44', paddingVertical: 8 },
  estBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#3DBDAA22', justifyContent: 'center', alignItems: 'center' },
  estValue: { fontSize: 16, fontWeight: '700', minWidth: 36, textAlign: 'center' },
});
