import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { Task, TaskList, TaskPriority, generateId, priorityColor } from '../../models/taskModels';
import * as taskService from '../../services/taskService';
import { logTaskCompletion } from '../../services/studyStatsService';

const LIST_COLORS = ['#2E86AB', '#3DBDAA', '#9381FF', '#52B788', '#F4A261', '#E76F51', '#7AAFC8'];
const PRIORITIES: TaskPriority[] = ['none', 'low', 'medium', 'high'];

type View_ = 'lists' | 'tasks';

export default function TodoPage() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { isDark } = useTheme();
  const theme = getTheme(isDark);

  const [view, setView] = useState<View_>('lists');
  const [lists, setLists] = useState<TaskList[]>([]);
  const [taskCountMap, setTaskCountMap] = useState<Record<string, number>>({});
  const [activeList, setActiveList] = useState<TaskList | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]); // tasks for active list

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

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ message: string; undoFn: () => void } | null>(null);
  const snackbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadLists = useCallback(async () => {
    const [l, allTasks] = await Promise.all([
      taskService.getAllLists(uid),
      taskService.getAllTasks(uid),
    ]);
    setLists(l);
    const counts: Record<string, number> = {};
    for (const list of l) {
      counts[list.id] = allTasks.filter((t) => t.listId === list.id && !t.completed).length;
    }
    setTaskCountMap(counts);
  }, [uid]);

  const loadTasks = useCallback(async (listId: string) => {
    const all = await taskService.getAllTasks(uid);
    setTasks(all.filter((t) => t.listId === listId));
  }, [uid]);

  useEffect(() => { loadLists(); }, [loadLists]);

  const openList = (list: TaskList) => {
    setActiveList(list);
    loadTasks(list.id);
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
    loadLists();
  };

  const handleDeleteList = (id: string) => {
    Alert.alert('Delete List', 'This will delete all tasks in this list.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await taskService.deleteList(uid, id);
          loadLists();
        },
      },
    ]);
  };

  const showSnackbar = (message: string, undoFn: () => void) => {
    if (snackbarTimer.current) clearTimeout(snackbarTimer.current);
    setSnackbar({ message, undoFn });
    snackbarTimer.current = setTimeout(() => setSnackbar(null), 3500);
  };

  const openAddTask = () => {
    setEditTask(null);
    setTaskTitle(''); setTaskDesc(''); setTaskPriority('none'); setTaskDue(''); setTaskRepeat('none');
    setTaskModal(true);
  };

  const openEditTask = (task: Task) => {
    setEditTask(task);
    setTaskTitle(task.title);
    setTaskDesc(task.description ?? '');
    setTaskPriority(task.priority);
    setTaskDue(task.dueDate ?? '');
    setTaskRepeat((task.repeatInterval as 'none' | 'daily' | 'weekly') ?? 'none');
    setTaskModal(true);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) { Alert.alert('Error', 'Please enter a task title.'); return; }
    if (!activeList) return;
    if (editTask) {
      const updated: Task = { ...editTask, title: taskTitle.trim(), description: taskDesc.trim() || undefined, priority: taskPriority, dueDate: taskDue || undefined, repeatInterval: taskRepeat };
      await taskService.updateTask(uid, updated);
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
        estimatedHours: 0,
        estimatedMinutes: 0,
        repeatInterval: taskRepeat,
        listId: activeList.id,
        subtasks: [],
        notes: [],
      };
      await taskService.addTask(uid, task);
    }
    setTaskModal(false);
    loadTasks(activeList.id);
  };

  const toggleTask = async (task: Task) => {
    const markingComplete = !task.completed;
    await taskService.updateTask(uid, {
      ...task, completed: markingComplete,
      progressState: markingComplete ? 'done' : 'notStarted',
      lastCompleted: markingComplete ? new Date().toISOString() : task.lastCompleted,
    });
    if (markingComplete) logTaskCompletion(uid, task.id);
    if (activeList) loadTasks(activeList.id);
  };

  const deleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await taskService.deleteTask(uid, id);
    if (activeList) loadTasks(activeList.id);
    showSnackbar('Task deleted', async () => {
      await taskService.addTask(uid, task);
      if (activeList) loadTasks(activeList.id);
    });
  };

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
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: isDark ? '#2D2D2D' : '#FFF' }]}>
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
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ── TASKS VIEW ──
  const completed = tasks.filter((t) => t.completed);
  const pending = tasks.filter((t) => !t.completed);

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

      {/* Snackbar */}
      {snackbar && (
        <View style={[styles.snackbar, { backgroundColor: isDark ? '#1E3A54' : '#142030' }]}>
          <Text style={styles.snackbarText}>{snackbar.message}</Text>
          <TouchableOpacity onPress={() => { snackbar.undoFn(); setSnackbar(null); }}>
            <Text style={styles.snackbarUndo}>UNDO</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Task Modal */}
      <Modal visible={taskModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#2D2D2D' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFF' : '#000' }]}>{editTask ? 'Edit Task' : 'New Task'}</Text>
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
              placeholder="Task title"
              placeholderTextColor="#666"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD', height: 70 }]}
              placeholder="Description (optional)"
              placeholderTextColor="#666"
              value={taskDesc}
              onChangeText={setTaskDesc}
              multiline
            />
            <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Priority</Text>
            <View style={styles.priorityRow}>
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
            <TextInput
              style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#444' : '#DDD' }]}
              placeholder="Due date (e.g. 2026-03-15)"
              placeholderTextColor="#666"
              value={taskDue}
              onChangeText={setTaskDue}
            />
            <Text style={[styles.label, { color: isDark ? '#AAA' : '#666' }]}>Repeat</Text>
            <View style={styles.priorityRow}>
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
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setTaskModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveTask}>
                <Text style={styles.confirmBtnText}>{editTask ? 'Save' : 'Add Task'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
          {task.subtasks.length > 0 && (
            <View style={[styles.tag, { backgroundColor: '#44444433' }]}>
              <Text style={[styles.tagText, { color: theme.textSecondary }]}>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks</Text>
            </View>
          )}
          {task.repeatInterval && task.repeatInterval !== 'none' && (
            <View style={[styles.tag, { backgroundColor: '#3DBDAA22' }]}>
              <Text style={[styles.tagText, { color: '#3DBDAA' }]}>↻ {task.repeatInterval}</Text>
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
  priorityRow: { flexDirection: 'row', gap: 8 },
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
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: {
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, textAlignVertical: 'top',
  },
  label: { fontSize: 13 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#33333366', alignItems: 'center' },
  cancelBtnText: { color: '#AAA', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#3DBDAA', alignItems: 'center' },
  confirmBtnText: { color: '#0D1B2A', fontWeight: '700' },
});
