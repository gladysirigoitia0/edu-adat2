export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  GUEST = 'GUEST'
}

export interface User {
  username: string;
  role: UserRole;
}

export enum LearningStyle {
  VISUAL = 'Visual',
  AUDITORY = 'Auditivo',
  KINESTHETIC = 'Kinestésico',
  READING_WRITING = 'Lectura/Escritura'
}

export interface SubjectInstance {
  id: string;
  name: string;
  code: string; // Unique code to share with teacher
  progress: number; // 0-100
  topicsCompleted: number;
  status: 'ACTIVE' | 'COMPLETED';
}

export interface StudentProfile {
  username?: string; // Link to auth user
  name: string;
  school: string;
  grade: string; // Curso
  division: string;
  learningStyle: LearningStyle;
  currentLevel: 'Principiante' | 'Intermedio' | 'Avanzado';
  weakAreas: string[];
  interests: string[];
  subjects: SubjectInstance[]; // Managed subjects
}

export interface VideoLink {
  title: string;
  url: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface AssessmentQuestion extends Question {
  subject: string;
}

export interface LessonContent {
  topic: string;
  explanation: string; // Adapted to learning style
  format: string; // e.g., "Diagrama", "Texto breve", "Podcast script"
  question: Question;
  videoLinks?: VideoLink[];
}

export interface FeedbackResponse {
  isCorrect: boolean;
  feedbackText: string;
  nextAction: 'ADVANCE' | 'REINFORCE' | 'RETRY';
  suggestedNextTopic?: string;
}

export interface StudentPerformance {
  studentName: string;
  school?: string;
  grade?: string;
  averageScore: number;
  completedModules: number;
  strugglingTopic: string;
  engagementLevel: 'Alto' | 'Medio' | 'Bajo';
}

export interface TeacherProfile {
  username?: string; // Link to auth user
  firstName: string;
  lastName: string;
  specialization: string;
}

export interface ClassGroup {
  id: string;
  school: string;
  grade: string;
  division: string;
  students: StudentPerformance[];
}