import React, { useState } from 'react';
import { UserRole } from '../types';
import { authService } from '../services/authService';
import { Lock, User, ArrowRight, School, GraduationCap, ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  targetRole: UserRole;
  onLoginSuccess: (username: string) => void;
  onCancel: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ targetRole, onLoginSuccess, onCancel }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.username || !formData.password) {
      setError('Por favor complete todos los campos');
      return;
    }

    if (isRegistering) {
      const result = authService.register(formData.username, formData.password, targetRole);
      if (result.success) {
        setSuccessMsg('Cuenta creada. Ahora puedes iniciar sesión.');
        setIsRegistering(false);
        setFormData({ username: '', password: '' });
      } else {
        setError(result.message);
      }
    } else {
      const result = authService.login(formData.username, formData.password, targetRole);
      if (result.success) {
        onLoginSuccess(formData.username);
      } else {
        setError(result.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-600 to-indigo-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-50 p-8 text-center relative">
          <button onClick={onCancel} className="absolute top-4 left-4 text-slate-400 hover:text-indigo-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            {targetRole === UserRole.STUDENT ? (
              <GraduationCap className="w-10 h-10 text-white" />
            ) : (
              <School className="w-10 h-10 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-indigo-900">
            {targetRole === UserRole.STUDENT ? 'Acceso Estudiante' : 'Acceso Docente'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isRegistering ? 'Crea tu cuenta para comenzar' : 'Ingresa tus credenciales'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg text-center">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  placeholder="Nombre de usuario"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>
            
            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md flex justify-center items-center">
              {isRegistering ? 'Registrarse' : 'Iniciar Sesión'}
              {!isRegistering && <ArrowRight className="ml-2 w-5 h-5" />}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              {isRegistering ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}
              <button 
                onClick={() => { setIsRegistering(!isRegistering); setError(''); setSuccessMsg(''); }}
                className="ml-2 font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition"
              >
                {isRegistering ? 'Inicia Sesión' : 'Regístrate aquí'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
