import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Home() {
  const [message, setMessage] = useState<string>('Carregando...');

  useEffect(() => {
    api.get('/api/opinions')
      .then(response => {
        setMessage(response.data.message);
      })
      .catch(error => {
        console.error('Erro ao buscar dados da API:', error);
        setMessage('Erro ao conectar com a API do backend.');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-8">
        opiniON
      </h1>
      
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 max-w-md w-full text-center hover:scale-105 transition-transform duration-300">
        <h2 className="text-2xl font-semibold text-slate-300 mb-4">Mensagem do Backend:</h2>
        <p className="text-lg text-emerald-300 bg-slate-900/50 p-4 rounded-xl font-mono">
          {message}
        </p>
      </div>
    </div>
  );
}
