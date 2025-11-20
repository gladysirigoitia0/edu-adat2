import React, { useState, useEffect } from 'react';
import { StudentProfile, LearningStyle, LessonContent, FeedbackResponse, AssessmentQuestion, SubjectInstance, User } from '../types';
import { generateLesson, evaluateAnswerAndRecalculate, generateAssessmentQuestions, analyzePlacementTest, generateSubjectCode } from '../services/geminiService';
import { authService } from '../services/authService';
import { Play, CheckCircle, AlertCircle, Loader2, ArrowRight, School, BookOpen, Video, Plus, Copy, ArrowLeft } from 'lucide-react';

type WizardStep = 'REGISTRATION' | 'WEAK_AREAS' | 'ASSESSMENT' | 'ANALYSIS' | 'DASHBOARD_HUB' | 'LESSON';

interface StudentDashboardProps {
  currentUser: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser }) => {
  // App Flow State
  const [step, setStep] = useState<WizardStep>('REGISTRATION');
  
  // Data State
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeSubject, setActiveSubject] = useState<SubjectInstance | null>(null);
  
  // Lesson State
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [lessonOption, setLessonOption] = useState<number | null>(null);
  
  // Registration Form State
  const [regForm, setRegForm] = useState({
    name: '',
    school: '',
    grade: '',
    division: ''
  });

  // Weak Areas State
  const [weakAreas, setWeakAreas] = useState<string[]>(['', '']);
  const [preferredStyle, setPreferredStyle] = useState<LearningStyle>(LearningStyle.VISUAL);

  // Add Subject State
  const [newSubjectName, setNewSubjectName] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  // Assessment State
  const [assessmentQuestions, setAssessmentQuestions] = useState<AssessmentQuestion[]>([]);
  const [assessmentAnswers, setAssessmentAnswers] = useState<{questionId: string, correct: boolean, subject: string}[]>([]);
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);

  // Loading State
  const [loading, setLoading] = useState(false);

  // --- Initialization: Check for existing profile ---
  useEffect(() => {
    const savedProfile = authService.getStudentProfile(currentUser.username);
    if (savedProfile) {
      setProfile(savedProfile);
      setStep('DASHBOARD_HUB');
    } else {
      setStep('REGISTRATION');
    }
  }, [currentUser.username]);

  // --- Save Profile Helper ---
  const updateAndSaveProfile = (newProfile: StudentProfile) => {
    setProfile(newProfile);
    authService.saveStudentProfile(currentUser.username, newProfile);
  };

  // --- Logic: Assessment Flow ---

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regForm.name && regForm.school && regForm.grade) {
      setStep('WEAK_AREAS');
    }
  };

  const handleWeakAreasSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Fetch questions based on grade
    try {
      const questions = await generateAssessmentQuestions(regForm.grade);
      setAssessmentQuestions(questions);
      setStep('ASSESSMENT');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentAnswer = (idx: number) => {
    const currentQ = assessmentQuestions[currentAssessmentIndex];
    const isCorrect = idx === currentQ.correctIndex;
    
    const newAnswer = { 
      questionId: currentQ.id, 
      correct: isCorrect, 
      subject: currentQ.subject 
    };

    setAssessmentAnswers([...assessmentAnswers, newAnswer]);

    if (currentAssessmentIndex < assessmentQuestions.length - 1) {
      setCurrentAssessmentIndex(currentAssessmentIndex + 1);
    } else {
      finishAssessment([...assessmentAnswers, newAnswer]);
    }
  };

  const finishAssessment = async (finalAnswers: any[]) => {
    setStep('ANALYSIS');
    setLoading(true);
    
    const validWeakAreas = weakAreas.filter(w => w.trim() !== '');

    try {
      const newProfile = await analyzePlacementTest(
        regForm,
        validWeakAreas,
        finalAnswers,
        preferredStyle
      );
      
      // Add username link
      const profileWithUser = { ...newProfile, username: currentUser.username };
      
      updateAndSaveProfile(profileWithUser);
      setStep('DASHBOARD_HUB');
    } catch (err) {
      console.error("Error creating profile", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic: Dashboard Hub ---

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !profile) return;

    const newSubject: SubjectInstance = {
      id: `subj_${Date.now()}`,
      name: newSubjectName,
      code: generateSubjectCode(newSubjectName),
      progress: 0,
      topicsCompleted: 0,
      status: 'ACTIVE'
    };

    const updatedProfile = {
      ...profile,
      subjects: [...profile.subjects, newSubject]
    };
    
    updateAndSaveProfile(updatedProfile);
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const startSubject = (subject: SubjectInstance) => {
    setActiveSubject(subject);
    // Start with introduction or next logical step
    const topic = subject.topicsCompleted === 0 ? `Introducción a ${subject.name}` : `Continuación de ${subject.name}`;
    loadLesson(profile!, topic, subject.name);
    setStep('LESSON');
  };

  // --- Logic: Learning Loop ---

  const loadLesson = async (userProfile: StudentProfile, topic: string, subjectName: string) => {
    setLoading(true);
    setFeedback(null);
    setLessonOption(null);
    try {
      const lesson = await generateLesson(userProfile, topic, subjectName);
      setCurrentLesson(lesson);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLessonAnswer = async () => {
    if (lessonOption === null || !currentLesson || !profile) return;
    setLoading(true);
    const response = await evaluateAnswerAndRecalculate(profile, currentLesson, lessonOption);
    setFeedback(response);
    
    // Update progress if correct
    if (response.isCorrect && activeSubject) {
       const updatedSubjects = profile.subjects.map(s => {
         if (s.id === activeSubject.id) {
           return {
             ...s,
             progress: Math.min(s.progress + 10, 100),
             topicsCompleted: s.topicsCompleted + 1
           };
         }
         return s;
       });
       updateAndSaveProfile({...profile, subjects: updatedSubjects});
    }

    setLoading(false);
  };

  const handleNextStep = () => {
    if (!feedback || !profile || !activeSubject) return;
    let nextTopic = feedback.suggestedNextTopic || "Siguiente Módulo";
    if (feedback.nextAction === 'RETRY') nextTopic = `Repaso: ${currentLesson?.topic}`;
    loadLesson(profile, nextTopic, activeSubject.name);
  };

  const handleBackToHub = () => {
    setActiveSubject(null);
    setCurrentLesson(null);
    setStep('DASHBOARD_HUB');
  };

  // --- Renders ---

  // 1. Registration Step
  if (step === 'REGISTRATION') {
    return (
      <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-xl shadow-xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <School className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-indigo-900">Bienvenido a EduAdapt</h2>
          <p className="text-slate-600 mt-2">Completa tu perfil estudiantil para comenzar.</p>
        </div>
        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nombre Completo</label>
            <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Escuela</label>
            <input required type="text" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
              value={regForm.school} onChange={e => setRegForm({...regForm, school: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Curso / Año</label>
              <input required type="text" placeholder="Ej: 5to Año" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={regForm.grade} onChange={e => setRegForm({...regForm, grade: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">División</label>
              <input required type="text" placeholder="Ej: B" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                value={regForm.division} onChange={e => setRegForm({...regForm, division: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition mt-4 flex justify-center items-center">
            Continuar <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  // 2. Weak Areas Step
  if (step === 'WEAK_AREAS') {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-xl border border-slate-100">
        <h2 className="text-2xl font-bold text-indigo-900 mb-2">Personaliza tu experiencia</h2>
        <p className="text-slate-600 mb-6">Ayúdanos a entender qué necesitas reforzar. Estas serán tus primeras materias.</p>
        
        <form onSubmit={handleWeakAreasSubmit} className="space-y-6">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-2">¿Qué materias o temas te cuestan más?</label>
             <div className="space-y-3">
               <input required type="text" placeholder="Ej: Matemáticas - Funciones" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500" 
                 value={weakAreas[0]} onChange={e => {const n = [...weakAreas]; n[0] = e.target.value; setWeakAreas(n)}} />
               <input required type="text" placeholder="Ej: Historia - Revolución Industrial" className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500" 
                 value={weakAreas[1]} onChange={e => {const n = [...weakAreas]; n[1] = e.target.value; setWeakAreas(n)}} />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">¿Cómo prefieres aprender?</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(LearningStyle).map((style) => (
                <button key={style} type="button"
                  onClick={() => setPreferredStyle(style)}
                  className={`p-3 rounded-lg border text-sm font-medium transition ${preferredStyle === style ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'border-slate-200 hover:border-indigo-300'}`}>
                  {style}
                </button>
              ))}
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex justify-center items-center">
            {loading ? <Loader2 className="animate-spin" /> : <>Ir al Diagnóstico <ArrowRight className="ml-2 w-5 h-5" /></>}
          </button>
        </form>
      </div>
    );
  }

  // 3. Assessment Quiz Step
  if (step === 'ASSESSMENT') {
    const question = assessmentQuestions[currentAssessmentIndex];
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-indigo-900">Diagnóstico Inicial</h2>
          <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
            {currentAssessmentIndex + 1} / {assessmentQuestions.length}
          </span>
        </div>
        
        {question ? (
          <div className="animate-fade-in">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">{question.subject}</span>
            <h3 className="text-lg font-medium text-slate-800 mb-6">{question.text}</h3>
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <button key={idx} onClick={() => handleAssessmentAnswer(idx)}
                  className="w-full text-left p-4 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10">Cargando preguntas...</div>
        )}
      </div>
    );
  }

  // 4. Analysis / Loading
  if (step === 'ANALYSIS' || (step === 'LESSON' && loading && !currentLesson)) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {step === 'ANALYSIS' ? 'Creando tu perfil y materias...' : 'Generando lección personalizada...'}
        </h2>
        <p className="text-slate-500 max-w-md text-center">
          Estamos adaptando el contenido a tu estilo {profile?.learningStyle || 'de aprendizaje'} y preparando tus materiales de refuerzo.
        </p>
      </div>
    );
  }

  // 5. Dashboard HUB
  if (step === 'DASHBOARD_HUB') {
    return (
      <div className="max-w-6xl mx-auto mt-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Hola, {profile?.name}</h1>
          <p className="text-slate-600">Aquí están tus materias de refuerzo. Comparte el código con tu profesor para que vea tu progreso.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Existing Subjects */}
          {profile?.subjects.map((subj) => (
            <div key={subj.id} className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition">
              <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
                <h3 className="font-bold text-lg truncate">{subj.name}</h3>
                <span className="text-xs bg-indigo-800 px-2 py-1 rounded">{subj.topicsCompleted} temas</span>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Código para Profesor</span>
                  <div className="flex items-center mt-1 bg-slate-100 p-2 rounded border border-slate-200">
                     <code className="text-lg font-mono text-indigo-700 font-bold flex-1">{subj.code}</code>
                     <Copy className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-500" title="Copiar" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">Progreso</span>
                    <span className="font-bold text-indigo-600">{subj.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${subj.progress}%` }}></div>
                  </div>
                </div>

                <button 
                  onClick={() => startSubject(subj)}
                  className="w-full flex justify-center items-center py-3 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition"
                >
                  <Play className="w-4 h-4 mr-2" /> Continuar
                </button>
              </div>
            </div>
          ))}

          {/* Add New Subject Card */}
          <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-6 min-h-[300px] hover:border-indigo-400 transition">
            {!isAddingSubject ? (
              <button onClick={() => setIsAddingSubject(true)} className="flex flex-col items-center text-slate-500 hover:text-indigo-600">
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-medium">Agregar Materia</span>
              </button>
            ) : (
              <form onSubmit={handleAddSubject} className="w-full">
                <h4 className="font-bold text-slate-700 mb-3 text-center">Nueva Materia</h4>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ej: Química, Inglés..." 
                  className="w-full p-3 border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                />
                <div className="flex space-x-2">
                  <button type="button" onClick={() => setIsAddingSubject(false)} className="flex-1 py-2 text-slate-500 hover:bg-slate-200 rounded-lg transition">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold">
                    Agregar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Lesson View
  return (
    <div className="max-w-5xl mx-auto mt-6 px-4 pb-20">
      {/* Header Info */}
      <div className="flex items-center mb-4">
        <button onClick={handleBackToHub} className="flex items-center text-slate-500 hover:text-indigo-600 transition mr-4">
          <ArrowLeft className="w-5 h-5 mr-1" /> Volver
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{activeSubject?.name}</span>
          <h1 className="text-2xl font-bold text-slate-800">{currentLesson?.topic}</h1>
        </div>
        <div className="mt-3 md:mt-0 text-right">
           <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-3 py-1 rounded-full">
             Nivel: {profile?.currentLevel}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Explanation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
            <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {currentLesson?.explanation}
            </div>
          </div>

          {/* Video Resources */}
          {currentLesson?.videoLinks && currentLesson.videoLinks.length > 0 && (
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-lg flex items-center mb-4 text-slate-800">
                 <Video className="w-5 h-5 mr-2 text-red-500" /> Videos Recomendados para {activeSubject?.name}
               </h3>
               <div className="space-y-3">
                 {currentLesson.videoLinks.map((video, idx) => (
                   <a key={idx} href={video.url} target="_blank" rel="noopener noreferrer" 
                      className="block p-3 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition group">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-indigo-700 group-hover:underline">{video.title}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500"/>
                      </div>
                   </a>
                 ))}
               </div>
             </div>
          )}
        </div>

        {/* Right: Activity */}
        <div className="lg:col-span-1">
          <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Play className="h-5 w-5 mr-2 text-indigo-500" /> 
              Actividad Práctica
            </h3>
            <p className="mb-6 text-slate-700 font-medium">{currentLesson?.question.text}</p>
            
            <div className="grid gap-3 mb-6">
              {currentLesson?.question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !feedback && setLessonOption(idx)}
                  disabled={!!feedback}
                  className={`text-left p-3 rounded-lg border text-sm transition relative ${
                    lessonOption === idx 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-white bg-white hover:border-indigo-200'
                  } ${feedback && idx === currentLesson?.question.correctIndex ? '!border-green-500 !bg-green-50' : ''}
                    ${feedback && lessonOption === idx && !feedback.isCorrect ? '!border-red-500 !bg-red-50' : ''}
                  `}
                >
                  <span className="font-bold mr-2 text-slate-400">{String.fromCharCode(65 + idx)}.</span>
                  {opt}
                  {feedback && idx === currentLesson?.question.correctIndex && <CheckCircle className="absolute right-2 top-3 text-green-600 h-5 w-5" />}
                  {feedback && lessonOption === idx && !feedback.isCorrect && <AlertCircle className="absolute right-2 top-3 text-red-600 h-5 w-5" />}
                </button>
              ))}
            </div>

            {!feedback ? (
              <button 
                onClick={handleSubmitLessonAnswer}
                disabled={lessonOption === null || loading}
                className={`w-full py-3 rounded-lg font-bold text-white transition ${
                  lessonOption !== null && !loading ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Verificar'}
              </button>
            ) : (
              <div className="animate-fade-in">
                <div className={`p-3 rounded-lg mb-4 text-sm ${feedback.isCorrect ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                  <p className="font-medium">{feedback.feedbackText}</p>
                </div>
                <button onClick={handleNextStep} className="w-full bg-indigo-900 text-white py-2 rounded-lg font-bold hover:bg-indigo-800 transition">
                  Siguiente Lección
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
