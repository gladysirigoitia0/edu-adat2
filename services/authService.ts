import { StudentProfile, TeacherProfile, UserRole, ClassGroup, StudentPerformance } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'eduadapt_users';
const PROFILES_STUDENT_KEY = 'eduadapt_profiles_student';
const PROFILES_TEACHER_KEY = 'eduadapt_profiles_teacher';
const GROUPS_KEY = 'eduadapt_teacher_groups';

export const authService = {
  // --- Auth Logic ---

  register: (username: string, password: string, role: UserRole): { success: boolean; message: string } => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    
    if (users[username]) {
      return { success: false, message: 'El usuario ya existe.' };
    }

    users[username] = { password, role };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return { success: true, message: 'Usuario creado con éxito.' };
  },

  login: (username: string, password: string, role: UserRole): { success: boolean; message: string } => {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[username];

    if (!user) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Contraseña incorrecta.' };
    }

    if (user.role !== role) {
      return { success: false, message: `Este usuario no tiene perfil de ${role === UserRole.STUDENT ? 'Estudiante' : 'Docente'}.` };
    }

    return { success: true, message: 'Login exitoso.' };
  },

  // --- Student Persistence ---

  saveStudentProfile: (username: string, profile: StudentProfile) => {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STUDENT_KEY) || '{}');
    profiles[username] = profile;
    localStorage.setItem(PROFILES_STUDENT_KEY, JSON.stringify(profiles));
  },

  getStudentProfile: (username: string): StudentProfile | null => {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STUDENT_KEY) || '{}');
    return profiles[username] || null;
  },

  // Search function to link real students to teachers
  findStudentBySubjectCode: (code: string): StudentPerformance | null => {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STUDENT_KEY) || '{}');
    
    // Iterate over all student profiles in the system
    for (const username in profiles) {
      const profile = profiles[username] as StudentProfile;
      
      // Check if this student has the requested subject code
      const matchingSubject = profile.subjects.find(subj => subj.code === code);
      
      if (matchingSubject) {
        // Return the student data formatted for the teacher view
        return {
          studentName: profile.name,
          school: profile.school,
          grade: profile.grade,
          averageScore: matchingSubject.progress, // Use the subject progress as score
          completedModules: matchingSubject.topicsCompleted,
          strugglingTopic: profile.weakAreas[0] || 'No reportado',
          engagementLevel: matchingSubject.progress > 70 ? 'Alto' : matchingSubject.progress > 30 ? 'Medio' : 'Bajo'
        };
      }
    }

    return null;
  },

  // --- Teacher Persistence ---

  saveTeacherProfile: (username: string, profile: TeacherProfile) => {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_TEACHER_KEY) || '{}');
    profiles[username] = profile;
    localStorage.setItem(PROFILES_TEACHER_KEY, JSON.stringify(profiles));
  },

  getTeacherProfile: (username: string): TeacherProfile | null => {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_TEACHER_KEY) || '{}');
    return profiles[username] || null;
  },

  saveTeacherGroups: (username: string, groups: ClassGroup[]) => {
    const allGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}');
    allGroups[username] = groups;
    localStorage.setItem(GROUPS_KEY, JSON.stringify(allGroups));
  },

  getTeacherGroups: (username: string): ClassGroup[] => {
    const allGroups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}');
    return allGroups[username] || [];
  }
};