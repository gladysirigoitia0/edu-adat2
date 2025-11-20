import React from 'react';
import { Brain, Target, Zap, Users, Code, Database, Server, Layout } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-blue-500 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Educación que se adapta a ti
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-indigo-100">
            EduAdapt transforma la educación tradicional utilizando Inteligencia Artificial para personalizar tu ruta de aprendizaje en tiempo real.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href="#features" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition shadow-lg">
              Descubrir Más
            </a>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section id="features" className="py-16 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-indigo-900">El Problema</h2>
            <p className="text-lg text-slate-600 mb-6">
              Los métodos tradicionales de "talla única" causan desmotivación y frustración. No todos aprendemos al mismo ritmo ni de la misma manera.
            </p>
            <h2 className="text-3xl font-bold mb-4 text-indigo-900">Nuestra Solución</h2>
            <p className="text-lg text-slate-600">
              EduAdapt detecta tus fortalezas individuales y adapta el contenido automáticamente. Si aprendes visualmente, te mostramos diagramas; si eres práctico, ejercicios. La IA recalcula tu ruta para asegurar el éxito.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
             <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
                <Brain className="w-10 h-10 text-purple-500 mr-4" />
                <div>
                  <h3 className="font-bold text-lg">IA Generativa</h3>
                  <p className="text-slate-600">Contenido creado al instante para tu perfil.</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
                <Target className="w-10 h-10 text-red-500 mr-4" />
                <div>
                  <h3 className="font-bold text-lg">Rutas Personalizadas</h3>
                  <p className="text-slate-600">El camino cambia según tu rendimiento.</p>
                </div>
             </div>
             <div className="bg-white p-6 rounded-xl shadow-md flex items-start">
                <Zap className="w-10 h-10 text-yellow-500 mr-4" />
                <div>
                  <h3 className="font-bold text-lg">Feedback Inmediato</h3>
                  <p className="text-slate-600">Entiende tus errores al momento.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 border-t border-slate-200">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12 text-indigo-900">Equipo EduAdapt</h2>
          <p className="mb-8 text-slate-600">Estudiantes de la Escuela Técnica N°2 Ceferino Namuncurá</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Paola', role: 'Analista', icon: Users },
              { name: 'Denise', role: 'Diseñadora', icon: Layout },
              { name: 'Ezequiel', role: 'Programador', icon: Code },
              { name: 'Francisco', role: 'Asistente', icon: Server },
            ].map((member) => (
              <div key={member.name} className="bg-white p-6 rounded-lg shadow hover:shadow-xl transition border border-slate-100">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <member.icon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="font-bold text-xl">{member.name}</h3>
                <p className="text-indigo-500 font-medium">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Requirements */}
      <section className="py-16 px-4 bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-white text-center">Ficha Técnica</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Layout className="w-6 h-6 text-blue-400 mr-2" />
                <h4 className="text-white font-bold">Frontend/Backend</h4>
              </div>
              <p>Sitio Web Integrado (React + Node.js ecosystem).</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Database className="w-6 h-6 text-green-400 mr-2" />
                <h4 className="text-white font-bold">Base de Datos</h4>
              </div>
              <p>Relacional (SQL Server / PostgreSQL) para perfiles y progreso.</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Server className="w-6 h-6 text-purple-400 mr-2" />
                <h4 className="text-white font-bold">Infraestructura</h4>
              </div>
              <p>Servidor Cloud (VPS/PaaS) para API y BD.</p>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg">
              <div className="flex items-center mb-3">
                <Code className="w-6 h-6 text-yellow-400 mr-2" />
                <h4 className="text-white font-bold">Herramientas</h4>
              </div>
              <p>Visual Studio Code, Git, Gemini API.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};