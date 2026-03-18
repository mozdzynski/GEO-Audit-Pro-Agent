import React, { useState } from 'react';
import { AuditData, FormInput, AppState, Competitor } from './types';
import { fetchCompetitors, runFinalAudit } from './services/geminiService';
import AuditForm from './components/AuditForm';
import CompetitorSelector from './components/CompetitorSelector';
import ResultsDashboard from './components/ResultsDashboard';

const App = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [formInput, setFormInput] = useState<FormInput | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleInitialSubmit = async (input: FormInput) => {
    setFormInput(input);
    setAppState(AppState.FETCHING_COMPETITORS);
    setErrorMsg(null);
    try {
      const list = await fetchCompetitors(input);
      setCompetitors(list);
      setAppState(AppState.SELECTING_COMPETITORS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Nie udało się pobrać listy konkurentów. Spróbuj ponownie.");
      setAppState(AppState.ERROR);
    }
  };

  const handleCompetitorConfirm = async (selected: Competitor[]) => {
    if (!formInput) return;
    setAppState(AppState.GENERATING_REPORT);
    setErrorMsg(null);
    try {
      const result = await runFinalAudit(formInput, selected);
      setAuditData(result);
      setAppState(AppState.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Wystąpił błąd podczas generowania raportu głównego. Spróbuj ponownie.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAuditData(null);
    setCompetitors([]);
    setFormInput(null);
    setAppState(AppState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans overflow-x-hidden">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
            <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <span className="font-bold text-white text-lg">G</span>
            </div>
            <span className="font-bold text-xl tracking-tight text-white">GEO Audit Pro</span>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-slate-800 rounded-full text-indigo-400 border border-slate-700">
            Powered by Gemini 3.0 Pro
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8 flex items-center justify-center">
        {appState === AppState.IDLE && (
          <div className="w-full flex flex-col items-center animate-fade-in-up">
            <div className="mb-12 text-center max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6">
                Widoczność w erze AI
              </h1>
              <p className="text-lg text-slate-400 leading-relaxed">
                Sprawdź, jak Twoja firma jest oceniana przez LLMy i porównaj się z konkurencją w Twoim mieście.
              </p>
            </div>
            <AuditForm onSubmit={handleInitialSubmit} isLoading={false} />
          </div>
        )}

        {appState === AppState.FETCHING_COMPETITORS && (
          <div className="w-full flex flex-col items-center">
             <div className="mb-12 text-center max-w-2xl animate-pulse">
              <h1 className="text-3xl font-bold text-slate-500 mb-4">
                Wyszukiwanie Konkurentów...
              </h1>
              <p className="text-slate-500">
                Przeszukujemy sieć w poszukiwaniu firm z Twojej branży w lokalizacji {formInput?.city}.
              </p>
            </div>
            <div className="w-full max-w-lg bg-slate-800 h-64 rounded-2xl animate-pulse border border-slate-700" />
          </div>
        )}

        {appState === AppState.SELECTING_COMPETITORS && (
          <CompetitorSelector 
            competitors={competitors} 
            onConfirm={handleCompetitorConfirm} 
            isLoading={false}
          />
        )}

        {appState === AppState.GENERATING_REPORT && (
          <div className="w-full flex flex-col items-center">
             <div className="mb-12 text-center max-w-2xl animate-pulse">
              <h1 className="text-3xl font-bold text-slate-500 mb-4">
                Generowanie Raportu GEO...
              </h1>
              <p className="text-slate-500">
                To może potrwać do minuty. Analizujemy E-E-A-T, Schema i porównujemy Cię z wybranymi firmami.
              </p>
            </div>
            <div className="w-full max-w-2xl bg-slate-800 h-96 rounded-2xl animate-pulse border border-slate-700" />
          </div>
        )}

        {appState === AppState.SUCCESS && auditData && (
          <ResultsDashboard data={auditData} onReset={handleReset} />
        )}

        {appState === AppState.ERROR && (
          <div className="text-center max-w-md bg-red-900/20 border border-red-800 p-8 rounded-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Błąd</h3>
            <p className="text-red-200 mb-6">{errorMsg}</p>
            <button 
              onClick={handleReset}
              className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Zacznij od nowa
            </button>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-slate-500 text-sm bg-slate-900">
        <p>© 2024 GEO Audit Pro Agent. AI Visibility Solutions.</p>
      </footer>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>
    </div>
  );
};

export default App;
