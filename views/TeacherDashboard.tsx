import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClassGroup, StudentPerformance, TeacherProfile, User } from '../types';
import { generateTeacherInsight, mockFetchStudentByCode } from '../services/geminiService';
import { authService } from '../services/authService';
import { Brain, AlertTriangle, MessageCircle, School, Users, Plus, ArrowRight, ArrowLeft, UserPlus, Loader2, CheckCircle } from 'lucide-react';

interface TeacherDashboardProps {
  currentUser: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentUser }) => {
  // Profile State
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  
  // Groups State
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<ClassGroup | null>(null);

  // Form States
  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', specialization: '' });
  const [newGroupForm, setNewGroupForm] = useState({ school: '', grade: '', division: '' });
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Add Student Logic
  const [studentCode, setStudentCode] = useState('');
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [addStudentLoading, setAddStudentLoading] = useState(false);
  const [addStudentError, setAddStudentError] = useState<string | null>(null);

  // AI Insight
  const [aiInsight, setAiInsight] = useState<string>('Selecciona un grupo para ver el análisis IA.');

  // --- Initialization: Check Profile & Groups ---
  useEffect(() => {
    const savedProfile = authService.getTeacherProfile(currentUser.username);
    if (savedProfile) {
      setTeacherProfile(savedProfile);
      const savedGroups = authService.getTeacherGroups(currentUser.username);
      setGroups(savedGroups);
    }
  }, [currentUser.username]);

  // --- Persistence Helpers ---
  const updateAndSaveGroups = (newGroups: ClassGroup[]) => {
    setGroups(newGroups);
    authService.saveTeacherGroups(currentUser.username, newGroups);
  };

  // --- Effects ---
  useEffect(() => {
    if (activeGroup && activeGroup.students.length > 0) {
      setAiInsight("Analizando datos...");
      generateTeacherInsight(activeGroup.students).then(setAiInsight);
    } else {
      setAiInsight("Agrega alumnos para obtener recomendaciones de IA.");
    }
  }, [activeGroup]);

  // --- Handlers ---

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.firstName && regForm.lastName && regForm.specialization) {
      const newProfile = { ...regForm, username: currentUser.username };
      setTeacherProfile(newProfile);
      authService.saveTeacherProfile(currentUser.username, newProfile);
      setGroups([]); 
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const newGroup: ClassGroup = {
      id: `group_${Date.now()}`,
      school: newGroupForm.school,
      grade: newGroupForm.grade,
      division: newGroupForm.division,
      students: []
    };
    const newGroupsList = [...groups, newGroup];
    updateAndSaveGroups(newGroupsList);
    
    setNewGroupForm({ school: '', grade: '', division: '' });
    setIsCreatingGroup(false);
    setActiveGroup(newGroup); // Auto-select new group
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentLoading(true);
    setAddStudentError(null);

    try {
      const student = await mockFetchStudentByCode(studentCode);
      
      if (student) {
        // Add to group
        const updatedGroup = {
          ...activeGroup!,
          students: [...activeGroup!.students, student]
        };
        
        // Update local state and groups list
        setActiveGroup(updatedGroup);
        
        const updatedGroupsList = groups.map(g => g.id === updatedGroup.id ? updatedGroup : g);
        updateAndSaveGroups(updatedGroupsList);

        setStudentCode('');
        setIsAddingStudent(false);
      } else {
        setAddStudentError("Código inválido o estudiante no encontrado.");
      }
    } catch (err) {
      setAddStudentError("Error de conexión.");
    } finally {
      setAddStudentLoading(false);
    }
  };

  // --- Views ---

  // 1. Registration View
  if (!teacherProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
             <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <School className="w-8 h-8 text-indigo-600" />
             </div>
             <h2 className="text-2xl font-bold text-indigo-900">Registro Docente</h2>
             <p className="text-slate-600">Configure su perfil para comenzar a gestionar clases.</p>
          </div>
          <form onSubmit={handleRegistration} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nombre</label>
                <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg"
                  value={regForm.firstName} onChange={e => setRegForm({...regForm, firstName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Apellido</label>
                <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg"
                  value={regForm.lastName} onChange={e => setRegForm({...regForm, lastName: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Especialidad / Materia</label>
              <input required type="text" placeholder="Ej: Matemáticas, Historia..." className="w-full p-3 border border-slate-300 rounded-lg"
                value={regForm.specialization} onChange={e => setRegForm({...regForm, specialization: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-indigo-800 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mt-2">
              Crear Perfil
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Group Detail View
  if (activeGroup) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => setActiveGroup(null)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Volver a mis grupos
            </button>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center">
              <School className="w-8 h-8 mr-3 text-indigo-600" />
              {activeGroup.grade} {activeGroup.division} - {activeGroup.school}
            </h1>
            <p className="text-slate-600 ml-11">Prof. {teacherProfile.lastName} • {teacherProfile.specialization}</p>
          </div>
          <button 
            onClick={() => setIsAddingStudent(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center shadow-md"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Cargar Alumno
          </button>
        </div>

        {/* Add Student Modal / Area */}
        {isAddingStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
              <h3 className="text-xl font-bold mb-4">Cargar Alumno</h3>
              <p className="text-slate-600 mb-4 text-sm">
                Pide al alumno el código único de tu materia (Ej: MAT-1234) que aparece en su panel.
              </p>
              <form onSubmit={handleAddStudent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código del Alumno</label>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="XXX-0000" 
                    className="w-full p-3 border border-slate-300 rounded-lg font-mono text-lg uppercase"
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value.toUpperCase())}
                  />
                  {addStudentError && <p className="text-red-500 text-sm mt-1">{addStudentError}</p>}
                </div>
                <div className="flex space-x-3">
                  <button type="button" onClick={() => setIsAddingStudent(false)} className="flex-1 py-2 border border-slate-300 rounded-lg hover:bg-slate-50">Cancelar</button>
                  <button disabled={addStudentLoading} type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 flex justify-center">
                    {addStudentLoading ? <Loader2 className="animate-spin" /> : 'Vincular'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insight Panel */}
          <div className="lg:col-span-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
             <div className="flex items-start">
                <Brain className="w-8 h-8 mr-3 opacity-90 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg">Insight de IA para {activeGroup.grade} {activeGroup.division}</h3>
                  <p className="text-indigo-100 mt-1">{aiInsight}</p>
                </div>
             </div>
          </div>

          {/* Students List */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Estudiantes ({activeGroup.students.length})</h3>
            </div>
            {activeGroup.students.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No hay estudiantes vinculados a este curso.</p>
                <p className="text-sm">Usa el botón "Cargar Alumno" para comenzar.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Nombre</th>
                    <th className="p-4">Promedio</th>
                    <th className="p-4">Módulos</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeGroup.students.map((student, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-800">{student.studentName}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${student.averageScore >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {student.averageScore}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-600">{student.completedModules}</td>
                      <td className="p-4">
                        {student.engagementLevel === 'Alto' && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {student.engagementLevel === 'Medio' && <div className="w-3 h-3 bg-yellow-500 rounded-full" />}
                        {student.engagementLevel === 'Bajo' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Stats / Graph */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-800 mb-6">Rendimiento</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeGroup.students}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="studentName" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="averageScore" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              <div className="bg-slate-50 p-3 rounded flex justify-between items-center">
                 <span className="text-sm text-slate-600">Promedio Curso</span>
                 <span className="font-bold text-indigo-600">
                   {activeGroup.students.length > 0 
                     ? Math.round(activeGroup.students.reduce((acc, s) => acc + s.averageScore, 0) / activeGroup.students.length) + '%' 
                     : '-'}
                 </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dashboard (Groups List)
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Hola, Prof. {teacherProfile.lastName}</h1>
          <p className="text-slate-600">Gestione sus cursos y estudiantes de {teacherProfile.specialization}.</p>
        </div>
        <button 
          onClick={() => setIsCreatingGroup(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" /> Crear Nuevo Grupo
        </button>
      </div>

      {/* Create Group Form (Overlay or Inline) */}
      {isCreatingGroup && (
        <div className="mb-8 bg-white p-6 rounded-xl shadow-lg border border-indigo-100 animate-fade-in">
          <h3 className="text-lg font-bold mb-4 text-indigo-900">Nuevo Curso</h3>
          <form onSubmit={handleCreateGroup} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Escuela</label>
               <input required type="text" placeholder="Ej: Técnica N°2" className="w-full p-2 border border-slate-300 rounded-lg"
                 value={newGroupForm.school} onChange={e => setNewGroupForm({...newGroupForm, school: e.target.value})} />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Año / Curso</label>
               <input required type="text" placeholder="Ej: 5to" className="w-full p-2 border border-slate-300 rounded-lg"
                 value={newGroupForm.grade} onChange={e => setNewGroupForm({...newGroupForm, grade: e.target.value})} />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">División</label>
               <input required type="text" placeholder="Ej: B" className="w-full p-2 border border-slate-300 rounded-lg"
                 value={newGroupForm.division} onChange={e => setNewGroupForm({...newGroupForm, division: e.target.value})} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsCreatingGroup(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition">Crear</button>
            </div>
          </form>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 && !isCreatingGroup && (
           <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-300 rounded-xl">
             <School className="w-16 h-16 text-slate-300 mx-auto mb-4" />
             <h3 className="text-xl font-bold text-slate-500 mb-2">No tiene grupos creados</h3>
             <p className="text-slate-400">Cree un grupo para comenzar a agregar alumnos.</p>
           </div>
        )}
        
        {groups.map((group) => (
          <div 
            key={group.id} 
            onClick={() => setActiveGroup(group)}
            className="bg-white p-6 rounded-xl shadow-md border border-slate-100 cursor-pointer hover:shadow-xl hover:border-indigo-300 transition group"
          >
             <div className="flex justify-between items-start mb-4">
               <div className="bg-indigo-50 p-3 rounded-lg group-hover:bg-indigo-100 transition">
                 <School className="w-8 h-8 text-indigo-600" />
               </div>
               <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded">
                 {group.students.length} Alumnos
               </span>
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-1">{group.grade} "{group.division}"</h3>
             <p className="text-slate-500 text-sm mb-6">{group.school}</p>
             
             <div className="flex items-center text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
               Gestionar Grupo <ArrowRight className="w-4 h-4 ml-1" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
