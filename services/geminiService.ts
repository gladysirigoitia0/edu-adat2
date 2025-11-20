import { GoogleGenAI, Type } from "@google/genai";
import { StudentProfile, LessonContent, FeedbackResponse, StudentPerformance, AssessmentQuestion, LearningStyle } from '../types';
import { authService } from './authService';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// Helper to generate a random code for subjects (e.g., MAT-4921)
export const generateSubjectCode = (subjectName: string): string => {
  const prefix = subjectName.substring(0, 3).toUpperCase();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

// Function to find a real student from LocalStorage using their unique subject code
export const mockFetchStudentByCode = async (code: string): Promise<StudentPerformance | null> => {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 600));

  // Use authService to find the actual student in our "database" (LocalStorage)
  const realStudent = authService.findStudentBySubjectCode(code);
  
  if (realStudent) {
    return realStudent;
  }

  // Fallback for DEMO purposes only if no real student is found with that code
  if (code === 'DEMO-1234') {
    return {
      studentName: "Alumno Demo",
      averageScore: 85,
      completedModules: 3,
      strugglingTopic: "Diagnóstico simulado",
      engagementLevel: 'Alto'
    };
  }

  return null;
};

export const generateAssessmentQuestions = async (grade: string): Promise<AssessmentQuestion[]> => {
  try {
    const prompt = `
      Genera un cuestionario de diagnóstico de exactamente 10 preguntas para un estudiante de nivel "${grade}".
      
      Requisitos:
      1. Las preguntas deben ser de cultura general variada (Matemáticas, Lengua, Ciencias Naturales, Historia).
      2. Formato Multiple Choice (3 o 4 opciones).
      3. Nivel académico acorde al año/curso mencionado.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  subject: { type: Type.STRING },
                  text: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result.questions || [];
  } catch (error) {
    console.error("Error generating assessment:", error);
    // Fallback questions
    return Array(10).fill(null).map((_, i) => ({
      id: `mock_${i}`,
      subject: 'General',
      text: `Pregunta de diagnóstico ${i + 1} (Simulada por error de conexión)`,
      options: ['Opción A', 'Opción B', 'Opción C'],
      correctIndex: 0
    }));
  }
};

export const analyzePlacementTest = async (
  basicInfo: { name: string, school: string, grade: string, division: string },
  weakAreas: string[],
  quizResults: { questionId: string, correct: boolean, subject: string }[],
  preferredStyle: LearningStyle
): Promise<StudentProfile> => {
  
  try {
    const correctCount = quizResults.filter(r => r.correct).length;
    const score = (correctCount / quizResults.length) * 100;
    
    // Simple logic for demo, usually AI would analyze deep patterns
    let calculatedLevel: 'Principiante' | 'Intermedio' | 'Avanzado' = 'Intermedio';
    if (score < 40) calculatedLevel = 'Principiante';
    if (score > 80) calculatedLevel = 'Avanzado';

    const prompt = `
      Analiza el perfil de un estudiante:
      - Grado: ${basicInfo.grade}
      - Áreas débiles reportadas: ${weakAreas.join(', ')}
      - Resultado test diagnóstico: ${score}% aciertos.
      - Estilo preferido: ${preferredStyle}

      Genera una lista de 3 intereses/temas clave para comenzar su ruta de aprendizaje.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            interests: { type: Type.ARRAY, items: { type: Type.STRING } }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");

    // Create initial subject instances from weak areas
    const initialSubjects = weakAreas
      .filter(area => area.trim() !== '')
      .map((area, index) => ({
        id: `subj_${index}`,
        name: area,
        code: generateSubjectCode(area),
        progress: 0,
        topicsCompleted: 0,
        status: 'ACTIVE' as const
      }));

    return {
      name: basicInfo.name,
      school: basicInfo.school,
      grade: basicInfo.grade,
      division: basicInfo.division,
      learningStyle: preferredStyle,
      currentLevel: calculatedLevel,
      weakAreas: weakAreas,
      interests: data.interests || weakAreas,
      subjects: initialSubjects
    };

  } catch (error) {
    console.error("Error analyzing placement:", error);
    
    const fallbackSubjects = weakAreas
      .filter(area => area.trim() !== '')
      .map((area, index) => ({
        id: `subj_${index}`,
        name: area,
        code: generateSubjectCode(area),
        progress: 0,
        topicsCompleted: 0,
        status: 'ACTIVE' as const
      }));

    return {
      name: basicInfo.name,
      school: basicInfo.school,
      grade: basicInfo.grade,
      division: basicInfo.division,
      learningStyle: preferredStyle,
      currentLevel: 'Intermedio',
      weakAreas: weakAreas,
      interests: weakAreas,
      subjects: fallbackSubjects
    };
  }
};

export const generateLesson = async (profile: StudentProfile, topic: string, contextSubject?: string): Promise<LessonContent> => {
  try {
    const subjectContext = contextSubject ? `Materia específica: ${contextSubject}.` : '';
    
    const prompt = `
      Genera una micro-lección educativa sobre "${topic}" para un estudiante de nivel "${profile.currentLevel}" (${profile.grade}).
      ${subjectContext}
      Estilo de aprendizaje: ${profile.learningStyle}.
      
      Reglas:
      1. Adapta la explicación al estilo (Visual: usa descripciones gráficas; Auditivo: conversacional; Kinestésico: práctico).
      2. Incluye una pregunta de validación.
      3. Recomienda 2 videos de YouTube educativos (solo título y URL simulada si no tienes acceso real, o URL genérica de búsqueda).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING },
            format: { type: Type.STRING },
            videoLinks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  url: { type: Type.STRING }
                }
              }
            },
            question: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                correctIndex: { type: Type.INTEGER }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as LessonContent;
  } catch (error) {
    console.error("Error generating lesson:", error);
    return {
      topic: topic,
      explanation: "Error al generar contenido. Intenta nuevamente.",
      format: "Texto estándar",
      question: {
        id: "err_1",
        text: "¿Intentar de nuevo?",
        options: ["Si", "No"],
        correctIndex: 0
      }
    };
  }
};

export const evaluateAnswerAndRecalculate = async (
  profile: StudentProfile,
  lesson: LessonContent,
  selectedOptionIndex: number
): Promise<FeedbackResponse> => {
  try {
    const selectedAnswer = lesson.question.options[selectedOptionIndex];
    
    const prompt = `
      Estudiante (${profile.currentLevel}) respondió "${selectedAnswer}" a: "${lesson.question.text}".
      Correcta: índice ${lesson.question.correctIndex}.
      
      1. Feedback breve y motivador.
      2. Acción: ADVANCE, REINFORCE, RETRY.
      3. Siguiente tema sugerido.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN },
            feedbackText: { type: Type.STRING },
            nextAction: { type: Type.STRING, enum: ['ADVANCE', 'REINFORCE', 'RETRY'] },
            suggestedNextTopic: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if(!text) throw new Error("No analysis from AI");

    return JSON.parse(text) as FeedbackResponse;

  } catch (error) {
    return {
      isCorrect: selectedOptionIndex === lesson.question.correctIndex,
      feedbackText: "Error de conexión. Respuesta registrada.",
      nextAction: 'ADVANCE',
      suggestedNextTopic: "Siguiente tema"
    };
  }
};

export const generateTeacherInsight = async (performanceData: StudentPerformance[]): Promise<string> => {
  try {
    const prompt = `Analiza estos datos de estudiantes y da una recomendación pedagógica breve: ${JSON.stringify(performanceData)}`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });
    return response.text || "Sin análisis.";
  } catch (error) {
    return "Análisis no disponible.";
  }
};