import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, TextInput, Alert, Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { getTheme } from '../../constants/colors';
import { generateId } from '../../models/taskModels';

// ── Types ──────────────────────────────────────────────

type Tab = 'courses' | 'gpa' | 'goal';

interface Assignment {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
}

interface Course {
  id: string;
  name: string;
  credits: number;
  assignments: Assignment[];
}

interface PastSemester {
  id: string;
  name: string;
  gpa: number;
  credits: number;
}

const COURSES_KEY = 'grades_courses';
const PAST_KEY = 'grades_past_semesters';

// ── Grade helpers ──────────────────────────────────────

function letterGrade(pct: number): string {
  if (pct >= 93) return 'A';
  if (pct >= 90) return 'A-';
  if (pct >= 87) return 'B+';
  if (pct >= 83) return 'B';
  if (pct >= 80) return 'B-';
  if (pct >= 77) return 'C+';
  if (pct >= 73) return 'C';
  if (pct >= 70) return 'C-';
  if (pct >= 67) return 'D+';
  if (pct >= 60) return 'D';
  return 'F';
}

function gradeColor(pct: number): string {
  if (pct >= 90) return '#4CAF50';
  if (pct >= 80) return '#8BC34A';
  if (pct >= 70) return '#FFD700';
  if (pct >= 60) return '#FF9800';
  return '#F44336';
}

function gpaColor(gpa: number): string {
  if (gpa >= 3.5) return '#4CAF50';
  if (gpa >= 3.0) return '#8BC34A';
  if (gpa >= 2.5) return '#FFD700';
  if (gpa >= 2.0) return '#FF9800';
  return '#F44336';
}

function pctToGPA(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 60) return 1.0;
  return 0.0;
}

function gpaStanding(gpa: number): string {
  if (gpa >= 3.7) return "Dean's List";
  if (gpa >= 3.0) return 'Good Standing';
  if (gpa >= 2.5) return 'Satisfactory';
  if (gpa >= 2.0) return 'Passing';
  return 'Needs Improvement';
}

function courseGrade(course: Course): number | null {
  if (course.assignments.length === 0) return null;
  const totalWeight = course.assignments.reduce((s, a) => s + a.weight, 0);
  if (totalWeight === 0) return null;
  const weighted = course.assignments.reduce((s, a) => s + (a.score / a.maxScore) * 100 * a.weight, 0);
  return weighted / totalWeight;
}

// ── Main Component ─────────────────────────────────────

export default function GradesPage() {
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const [tab, setTab] = useState<Tab>('courses');

  // ── State ──
  const [courses, setCourses] = useState<Course[]>([]);
  const [pastSemesters, setPastSemesters] = useState<PastSemester[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add course form
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCredits, setNewCredits] = useState('3');

  // Add assignment form (for the expanded course)
  const [aName, setAName] = useState('');
  const [aScore, setAScore] = useState('');
  const [aMax, setAMax] = useState('100');
  const [aWeight, setAWeight] = useState('');

  // Past semester form
  const [showAddPast, setShowAddPast] = useState(false);
  const [psName, setPsName] = useState('');
  const [psGpa, setPsGpa] = useState('');
  const [psCredits, setPsCredits] = useState('15');

  // Goal calculator
  const [currentGrade, setCurrentGrade] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const [goalGrade, setGoalGrade] = useState('');
  const [remainingWeight, setRemainingWeight] = useState('');

  // ── Persistence ──
  useEffect(() => {
    AsyncStorage.getItem(COURSES_KEY).then((v) => v && setCourses(JSON.parse(v)));
    AsyncStorage.getItem(PAST_KEY).then((v) => v && setPastSemesters(JSON.parse(v)));
  }, []);

  const saveCourses = (updated: Course[]) => {
    setCourses(updated);
    AsyncStorage.setItem(COURSES_KEY, JSON.stringify(updated));
  };

  const savePast = (updated: PastSemester[]) => {
    setPastSemesters(updated);
    AsyncStorage.setItem(PAST_KEY, JSON.stringify(updated));
  };

  // ── Course actions ──
  const addCourse = () => {
    if (!newName.trim()) { Alert.alert('Error', 'Enter a course name.'); return; }
    const credits = parseFloat(newCredits);
    if (isNaN(credits) || credits <= 0) { Alert.alert('Error', 'Enter valid credits.'); return; }
    saveCourses([...courses, { id: generateId(), name: newName.trim(), credits, assignments: [] }]);
    setNewName(''); setNewCredits('3'); setShowAddCourse(false);
    Keyboard.dismiss();
  };

  const removeCourse = (id: string) => {
    Alert.alert('Remove Course', 'Delete this course and all its grades?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        saveCourses(courses.filter((c) => c.id !== id));
        if (expandedId === id) setExpandedId(null);
      }},
    ]);
  };

  // ── Assignment actions ──
  const addAssignment = (courseId: string) => {
    const score = parseFloat(aScore);
    const max = parseFloat(aMax);
    const weight = parseFloat(aWeight);
    if (!aName.trim() || isNaN(score) || isNaN(max) || isNaN(weight)) {
      Alert.alert('Error', 'Fill in all fields.'); return;
    }
    if (max <= 0 || weight <= 0) { Alert.alert('Error', 'Max score and weight must be > 0'); return; }
    const assignment: Assignment = { id: generateId(), name: aName.trim(), score, maxScore: max, weight };
    saveCourses(courses.map((c) =>
      c.id === courseId ? { ...c, assignments: [...c.assignments, assignment] } : c
    ));
    setAName(''); setAScore(''); setAMax('100'); setAWeight('');
    Keyboard.dismiss();
  };

  const removeAssignment = (courseId: string, assignId: string) => {
    saveCourses(courses.map((c) =>
      c.id === courseId ? { ...c, assignments: c.assignments.filter((a) => a.id !== assignId) } : c
    ));
  };

  // ── Past semester actions ──
  const addPastSemester = () => {
    if (!psName.trim()) { Alert.alert('Error', 'Enter a semester name.'); return; }
    const gpa = parseFloat(psGpa);
    const credits = parseFloat(psCredits);
    if (isNaN(gpa) || gpa < 0 || gpa > 4) { Alert.alert('Error', 'GPA must be between 0 and 4.'); return; }
    if (isNaN(credits) || credits <= 0) { Alert.alert('Error', 'Enter valid credits.'); return; }
    savePast([...pastSemesters, { id: generateId(), name: psName.trim(), gpa, credits }]);
    setPsName(''); setPsGpa(''); setPsCredits('15'); setShowAddPast(false);
    Keyboard.dismiss();
  };

  const removePastSemester = (id: string) => {
    savePast(pastSemesters.filter((s) => s.id !== id));
  };

  // ── Computed values ──
  const semesterGPA = (() => {
    const graded = courses.filter((c) => courseGrade(c) !== null);
    if (graded.length === 0) return null;
    const totalCredits = graded.reduce((s, c) => s + c.credits, 0);
    const totalPoints = graded.reduce((s, c) => s + pctToGPA(courseGrade(c)!) * c.credits, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  })();

  const semesterCredits = courses.reduce((s, c) => s + c.credits, 0);

  const cgpa = (() => {
    const all = [
      ...pastSemesters,
      ...(semesterGPA !== null ? [{ gpa: semesterGPA, credits: semesterCredits }] : []),
    ];
    if (all.length === 0) return null;
    const totalCredits = all.reduce((s, x) => s + x.credits, 0);
    const totalPoints = all.reduce((s, x) => s + x.gpa * x.credits, 0);
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  })();

  const neededGrade = (() => {
    const cur = parseFloat(currentGrade);
    const curW = parseFloat(currentWeight);
    const goal = parseFloat(goalGrade);
    const remW = parseFloat(remainingWeight);
    if (isNaN(cur) || isNaN(curW) || isNaN(goal) || isNaN(remW) || remW <= 0) return null;
    return (goal * (curW + remW) - cur * curW) / remW;
  })();

  const TABS: { key: Tab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'courses', label: 'Courses', icon: 'book-outline' },
    { key: 'gpa', label: 'GPA', icon: 'school-outline' },
    { key: 'goal', label: 'Goal', icon: 'flag-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Tab bar */}
      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: '#5B8DEF' }]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon} size={18} color={tab === t.key ? '#5B8DEF' : theme.textSecondary} />
            <Text style={[styles.tabLabel, { color: tab === t.key ? '#5B8DEF' : theme.textSecondary },
              tab === t.key && { fontWeight: '700' }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ══ COURSES TAB ══ */}
        {tab === 'courses' && (
          <View style={{ gap: 12 }}>

            {/* Summary row */}
            {(semesterGPA !== null || cgpa !== null) && (
              <View style={styles.summaryRow}>
                {semesterGPA !== null && (
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Semester GPA</Text>
                    <Text style={[styles.summaryGPA, { color: gpaColor(semesterGPA) }]}>
                      {semesterGPA.toFixed(2)}
                    </Text>
                  </View>
                )}
                {cgpa !== null && (
                  <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>CGPA</Text>
                    <Text style={[styles.summaryGPA, { color: gpaColor(cgpa) }]}>
                      {cgpa.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Add course button / form */}
            {!showAddCourse ? (
              <TouchableOpacity
                style={[styles.addCourseBtn, { borderColor: theme.border }]}
                onPress={() => setShowAddCourse(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#5B8DEF" />
                <Text style={[styles.addCourseBtnText, { color: '#5B8DEF' }]}>Add Course</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.surface }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>New Course</Text>
                <TextInput
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Course name (e.g. Calculus II)"
                  placeholderTextColor={theme.textSecondary}
                  value={newName}
                  onChangeText={setNewName}
                />
                <View style={styles.rowGap}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Credit hours</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                      placeholder="3"
                      placeholderTextColor={theme.textSecondary}
                      value={newCredits}
                      onChangeText={setNewCredits}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
                <View style={styles.rowGap}>
                  <TouchableOpacity style={[styles.btnSecondary, { borderColor: theme.border }]} onPress={() => setShowAddCourse(false)}>
                    <Text style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnPrimary} onPress={addCourse}>
                    <Text style={styles.btnPrimaryText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Course list */}
            {courses.length === 0 && !showAddCourse && (
              <View style={styles.empty}>
                <Ionicons name="book-outline" size={40} color={theme.textSecondary} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No courses yet. Add your courses to start tracking grades.
                </Text>
              </View>
            )}

            {courses.map((course) => {
              const grade = courseGrade(course);
              const isExpanded = expandedId === course.id;
              return (
                <View key={course.id} style={[styles.card, { backgroundColor: theme.surface }]}>
                  {/* Course header */}
                  <TouchableOpacity
                    style={styles.courseHeader}
                    onPress={() => setExpandedId(isExpanded ? null : course.id)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.courseName, { color: theme.text }]}>{course.name}</Text>
                      <Text style={[styles.courseMeta, { color: theme.textSecondary }]}>
                        {course.credits} credit{course.credits !== 1 ? 's' : ''} · {course.assignments.length} assignment{course.assignments.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.courseRight}>
                      {grade !== null ? (
                        <View style={styles.gradeChip}>
                          <Text style={[styles.gradeChipPct, { color: gradeColor(grade) }]}>{grade.toFixed(1)}%</Text>
                          <Text style={[styles.gradeChipLetter, { color: gradeColor(grade) }]}>{letterGrade(grade)}</Text>
                        </View>
                      ) : (
                        <Text style={[styles.noGrade, { color: theme.textSecondary }]}>—</Text>
                      )}
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18} color={theme.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Expanded: assignments */}
                  {isExpanded && (
                    <View style={styles.expandedBody}>
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />

                      {/* Assignment list */}
                      {course.assignments.length > 0 && (
                        <View style={{ gap: 8 }}>
                          {course.assignments.map((a) => {
                            const pct = (a.score / a.maxScore) * 100;
                            return (
                              <View key={a.id} style={[styles.assignmentRow, { backgroundColor: theme.background }]}>
                                <View style={[styles.colorBar, { backgroundColor: gradeColor(pct) }]} />
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.assignName, { color: theme.text }]}>{a.name}</Text>
                                  <Text style={[styles.assignMeta, { color: theme.textSecondary }]}>
                                    {a.score}/{a.maxScore} · {a.weight}% weight
                                  </Text>
                                </View>
                                <Text style={[styles.assignPct, { color: gradeColor(pct) }]}>{pct.toFixed(1)}%</Text>
                                <TouchableOpacity onPress={() => removeAssignment(course.id, a.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                  <Ionicons name="close-circle-outline" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                          {/* Progress bar */}
                          {grade !== null && (
                            <View style={[styles.progressBg, { backgroundColor: theme.background }]}>
                              <View style={[styles.progressFill, { width: `${Math.min(grade, 100)}%`, backgroundColor: gradeColor(grade) }]} />
                            </View>
                          )}
                        </View>
                      )}

                      {/* Add assignment form */}
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary, marginTop: 8 }]}>Add Grade</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="Assignment name"
                        placeholderTextColor={theme.textSecondary}
                        value={isExpanded ? aName : ''}
                        onChangeText={setAName}
                      />
                      <View style={styles.rowGap}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Score</Text>
                          <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="85"
                            placeholderTextColor={theme.textSecondary}
                            value={isExpanded ? aScore : ''}
                            onChangeText={setAScore}
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Out of</Text>
                          <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="100"
                            placeholderTextColor={theme.textSecondary}
                            value={isExpanded ? aMax : ''}
                            onChangeText={setAMax}
                            keyboardType="decimal-pad"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Weight %</Text>
                          <TextInput
                            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                            placeholder="20"
                            placeholderTextColor={theme.textSecondary}
                            value={isExpanded ? aWeight : ''}
                            onChangeText={setAWeight}
                            keyboardType="decimal-pad"
                          />
                        </View>
                      </View>
                      <TouchableOpacity style={styles.btnPrimary} onPress={() => addAssignment(course.id)}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.btnPrimaryText}>Add Grade</Text>
                      </TouchableOpacity>

                      {/* Remove course */}
                      <TouchableOpacity style={styles.removeCourseBtn} onPress={() => removeCourse(course.id)}>
                        <Ionicons name="trash-outline" size={14} color="#F44336" />
                        <Text style={styles.removeCourseBtnText}>Remove Course</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ══ GPA TAB ══ */}
        {tab === 'gpa' && (
          <View style={{ gap: 12 }}>

            {/* CGPA hero */}
            <View style={[styles.card, { backgroundColor: theme.surface, alignItems: 'center', paddingVertical: 28 }]}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Cumulative GPA</Text>
              {cgpa !== null ? (
                <>
                  <Text style={[styles.heroGPA, { color: gpaColor(cgpa) }]}>{cgpa.toFixed(3)}</Text>
                  <Text style={[styles.standingText, { color: theme.textSecondary }]}>{gpaStanding(cgpa)}</Text>
                </>
              ) : (
                <Text style={[styles.heroGPA, { color: theme.textSecondary }]}>—</Text>
              )}
            </View>

            {/* Current semester */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Current Semester</Text>
              {semesterGPA !== null ? (
                <View style={styles.semesterRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.semGPA, { color: gpaColor(semesterGPA) }]}>{semesterGPA.toFixed(2)}</Text>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{gpaStanding(semesterGPA)}</Text>
                  </View>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{semesterCredits} credits</Text>
                </View>
              ) : (
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  Add courses and grades in the Courses tab to see your semester GPA.
                </Text>
              )}

              {/* Per-course breakdown */}
              {courses.filter((c) => courseGrade(c) !== null).map((c) => {
                const g = courseGrade(c)!;
                const gpa = pctToGPA(g);
                return (
                  <View key={c.id} style={[styles.assignmentRow, { backgroundColor: theme.background, marginTop: 4 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.assignName, { color: theme.text }]}>{c.name}</Text>
                      <Text style={[styles.assignMeta, { color: theme.textSecondary }]}>{c.credits} cr</Text>
                    </View>
                    <Text style={[styles.assignPct, { color: gradeColor(g) }]}>{g.toFixed(1)}%</Text>
                    <Text style={[styles.assignPct, { color: gpaColor(gpa), minWidth: 36, textAlign: 'right' }]}>{gpa.toFixed(1)}</Text>
                  </View>
                );
              })}
            </View>

            {/* Past semesters */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Past Semesters</Text>
                <TouchableOpacity onPress={() => setShowAddPast(!showAddPast)}>
                  <Ionicons name={showAddPast ? 'close-circle-outline' : 'add-circle-outline'} size={22} color="#5B8DEF" />
                </TouchableOpacity>
              </View>

              {showAddPast && (
                <View style={{ gap: 8 }}>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="Semester name (e.g. Fall 2024)"
                    placeholderTextColor={theme.textSecondary}
                    value={psName}
                    onChangeText={setPsName}
                  />
                  <View style={styles.rowGap}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>GPA (0–4)</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="3.50"
                        placeholderTextColor={theme.textSecondary}
                        value={psGpa}
                        onChangeText={setPsGpa}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Credits</Text>
                      <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                        placeholder="15"
                        placeholderTextColor={theme.textSecondary}
                        value={psCredits}
                        onChangeText={setPsCredits}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <TouchableOpacity style={styles.btnPrimary} onPress={addPastSemester}>
                    <Text style={styles.btnPrimaryText}>Add Semester</Text>
                  </TouchableOpacity>
                </View>
              )}

              {pastSemesters.length === 0 && !showAddPast && (
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                  Add past semesters to calculate your cumulative GPA.
                </Text>
              )}

              {pastSemesters.map((s) => (
                <View key={s.id} style={[styles.assignmentRow, { backgroundColor: theme.background }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.assignName, { color: theme.text }]}>{s.name}</Text>
                    <Text style={[styles.assignMeta, { color: theme.textSecondary }]}>{s.credits} credits</Text>
                  </View>
                  <Text style={[styles.semGPA, { color: gpaColor(s.gpa), fontSize: 18 }]}>{s.gpa.toFixed(2)}</Text>
                  <TouchableOpacity onPress={() => removePastSemester(s.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close-circle-outline" size={18} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* GPA scale reference */}
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>GPA Scale Reference</Text>
              {[
                { range: '93–100%', letter: 'A',  gpa: '4.0' },
                { range: '90–92%',  letter: 'A-', gpa: '3.7' },
                { range: '87–89%',  letter: 'B+', gpa: '3.3' },
                { range: '83–86%',  letter: 'B',  gpa: '3.0' },
                { range: '80–82%',  letter: 'B-', gpa: '2.7' },
                { range: '77–79%',  letter: 'C+', gpa: '2.3' },
                { range: '73–76%',  letter: 'C',  gpa: '2.0' },
                { range: '70–72%',  letter: 'C-', gpa: '1.7' },
                { range: '60–69%',  letter: 'D',  gpa: '1.0' },
                { range: '< 60%',   letter: 'F',  gpa: '0.0' },
              ].map((row) => (
                <View key={row.letter} style={styles.refRow}>
                  <Text style={[styles.refRange, { color: theme.textSecondary }]}>{row.range}</Text>
                  <Text style={[styles.refLetter, { color: theme.text }]}>{row.letter}</Text>
                  <Text style={[styles.refGPA, { color: '#5B8DEF' }]}>{row.gpa}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ══ GOAL TAB ══ */}
        {tab === 'goal' && (
          <View style={{ gap: 12 }}>
            <View style={[styles.card, { backgroundColor: theme.surface }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>What grade do I need?</Text>
              <Text style={[styles.goalDesc, { color: theme.textSecondary }]}>
                Enter your current standing and goal to calculate what you need on remaining work.
              </Text>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Current Grade %</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="78"
                    placeholderTextColor={theme.textSecondary}
                    value={currentGrade}
                    onChangeText={setCurrentGrade}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Completed Weight %</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="60"
                    placeholderTextColor={theme.textSecondary}
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.rowGap}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Goal Grade %</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="85"
                    placeholderTextColor={theme.textSecondary}
                    value={goalGrade}
                    onChangeText={setGoalGrade}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Remaining Weight %</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                    placeholder="40"
                    placeholderTextColor={theme.textSecondary}
                    value={remainingWeight}
                    onChangeText={setRemainingWeight}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>

            {neededGrade !== null && (
              <View style={[styles.card, { backgroundColor: theme.surface, alignItems: 'center', paddingVertical: 28 }]}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>You need to score</Text>
                <Text style={[styles.heroGPA, { color: neededGrade > 100 ? '#F44336' : neededGrade < 0 ? '#4CAF50' : gradeColor(Math.min(neededGrade, 100)) }]}>
                  {neededGrade > 100 ? '> 100%' : neededGrade < 0 ? 'Already there!' : `${neededGrade.toFixed(1)}%`}
                </Text>
                <Text style={[styles.standingText, { color: theme.textSecondary }]}>
                  {neededGrade > 100
                    ? 'Goal is not mathematically achievable.'
                    : neededGrade < 0
                    ? 'You have already exceeded your goal!'
                    : `on the remaining ${remainingWeight}% of the course`}
                </Text>
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 13 },
  scroll: { padding: 16, gap: 12, paddingBottom: 48 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '500' },
  summaryGPA: { fontSize: 32, fontWeight: '800' },

  // Cards
  card: { borderRadius: 18, padding: 18, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  // Add course button
  addCourseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
  },
  addCourseBtnText: { fontSize: 15, fontWeight: '600' },

  // Course
  courseHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  courseName: { fontSize: 15, fontWeight: '600' },
  courseMeta: { fontSize: 12, marginTop: 2 },
  courseRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeChip: { alignItems: 'flex-end' },
  gradeChipPct: { fontSize: 15, fontWeight: '700' },
  gradeChipLetter: { fontSize: 11, fontWeight: '600' },
  noGrade: { fontSize: 20, fontWeight: '300' },

  // Expanded
  expandedBody: { gap: 8 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  assignmentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10 },
  colorBar: { width: 3, height: 32, borderRadius: 2 },
  assignName: { fontSize: 13, fontWeight: '600' },
  assignMeta: { fontSize: 11, marginTop: 1 },
  assignPct: { fontSize: 13, fontWeight: '700' },

  // Progress bar
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },

  // Inputs
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  fieldLabel: { fontSize: 12, fontWeight: '500', marginBottom: 3 },
  rowGap: { flexDirection: 'row', gap: 8 },

  // Buttons
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#5B8DEF', padding: 12, borderRadius: 12 },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnSecondary: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  btnSecondaryText: { fontWeight: '600', fontSize: 14 },
  removeCourseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 4 },
  removeCourseBtnText: { color: '#F44336', fontSize: 12 },

  // GPA tab
  heroGPA: { fontSize: 56, fontWeight: '800', letterSpacing: -1 },
  standingText: { fontSize: 14 },
  semesterRow: { flexDirection: 'row', alignItems: 'center' },
  semGPA: { fontSize: 24, fontWeight: '800' },

  // Reference table
  refRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  refRange: { flex: 2, fontSize: 13 },
  refLetter: { flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  refGPA: { flex: 1, fontSize: 13, fontWeight: '600', textAlign: 'right' },

  // Goal
  goalDesc: { fontSize: 13, lineHeight: 19 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, textAlign: 'center', maxWidth: 240, lineHeight: 20 },
});
