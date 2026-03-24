import React, { useState, useMemo } from 'react';
import { Competitor } from '../types';

interface CompetitorSelectorProps {
  competitors: Competitor[];
  onConfirm: (selected: Competitor[]) => void;
  isLoading: boolean;
}

const CompetitorSelector: React.FC<CompetitorSelectorProps> = ({ competitors, onConfirm, isLoading }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [scoreFilter, setScoreFilter] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const businessTypes = useMemo(() => 
    Array.from(new Set(competitors.map(c => c.businessType))),
    [competitors]
  );

  const filteredCompetitors = useMemo(() => {
    return competitors.filter(c => {
      const matchesType = typeFilter === '' || c.businessType === typeFilter;
      const matchesScore = c.estimatedScore >= scoreFilter;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesScore && matchesSearch;
    });
  }, [competitors, typeFilter, scoreFilter, searchTerm]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 3) return prev; // Max 3 remains
      return [...prev, id];
    });
  };

  const handleConfirm = () => {
    if (selectedIds.length === 0) return;
    const selected = competitors.filter(c => selectedIds.includes(c.id));
    onConfirm(selected);
  };

  const progressPercentage = (selectedIds.length / 3) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in-up">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Wybierz Konkurentów do Porównania</h2>
          <p className="text-slate-400">Wybierz od 1 do 3 firm, które AI ma przeanalizować i porównać w Twoim raporcie.</p>
        </div>
        
        {/* Visual Progress Indicator in Header */}
        <div className="flex flex-col items-end min-w-[140px]">
          <div className="flex justify-between w-full mb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase">Krok 2/3: Wybór</span>
            <span className="text-xs font-bold text-indigo-400">{selectedIds.length}/3</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div 
              className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-500 ease-out" 
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="mb-8 bg-slate-900/40 p-6 rounded-2xl border border-slate-700/50 shadow-inner">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtruj i Szukaj
          </h3>
          {(typeFilter !== '' || scoreFilter > 0 || searchTerm !== '') && (
            <button 
              onClick={() => { setTypeFilter(''); setScoreFilter(0); setSearchTerm(''); }}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              Wyczyść wszystko
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search Input */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Szukaj po nazwie</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Wpisz nazwę firmy..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Business Type Dropdown */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Branża / Typ</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="">Wszystkie ({competitors.length})</option>
                {businessTypes.map(t => (
                  <option key={t} value={t}>
                    {t} ({competitors.filter(c => c.businessType === t).length})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Score Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Min. AI Score</label>
              <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{scoreFilter}%</span>
            </div>
            <div className="pt-3">
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={scoreFilter} 
                onChange={(e) => setScoreFilter(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
              />
              <div className="flex justify-between mt-2 text-[8px] text-slate-600 font-bold uppercase tracking-tighter">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
          <span className="text-[10px] text-slate-500 font-medium">
            Pokazuję <span className="text-slate-300 font-bold">{filteredCompetitors.length}</span> z <span className="text-slate-300 font-bold">{competitors.length}</span> firm
          </span>
          {selectedIds.length > 0 && (
            <span className="text-[10px] text-indigo-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              Wybrano {selectedIds.length}/3 do raportu
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[420px] overflow-y-auto p-2 custom-scrollbar">
        {filteredCompetitors.map(c => {
          const isSelected = selectedIds.includes(c.id);
          const isDisabled = !isSelected && selectedIds.length >= 3;

          return (
            <div 
              key={c.id}
              onClick={() => !isDisabled && toggleSelection(c.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer relative group shadow-lg ${
                isSelected 
                  ? 'bg-indigo-900/40 border-indigo-500 shadow-indigo-500/20' 
                  : isDisabled 
                    ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed shadow-none'
                    : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800 hover:shadow-xl'
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-indigo-500 text-white rounded-full p-1 shadow-lg z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/50 px-2 py-0.5 rounded uppercase tracking-tighter truncate max-w-[100px]">{c.businessType}</span>
                <span className={`text-xs font-mono ${isSelected ? 'text-indigo-300' : 'text-slate-500'}`}>{c.estimatedScore}%</span>
              </div>
              <h4 className="text-white font-bold mb-3 truncate leading-tight">{c.name}</h4>
              <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${isSelected ? 'bg-indigo-400' : 'bg-slate-600'}`} 
                  style={{ width: `${c.estimatedScore}%` }} 
                />
              </div>
            </div>
          );
        })}
        {filteredCompetitors.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Brak wyników spełniających kryteria.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-700 pt-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="text-slate-300 text-sm whitespace-nowrap">
            Status: <span className={`font-bold ${selectedIds.length > 0 ? 'text-green-400' : 'text-indigo-400'}`}>
              {selectedIds.length === 0 
                ? 'Wybierz przynajmniej 1 firmę' 
                : selectedIds.length === 3 
                  ? 'Maksymalna liczba wybrana' 
                  : `Wybrano ${selectedIds.length}/3 (możesz dodać więcej)`}
            </span>
          </div>
          {/* Circular progress alternative for mobile/compact view */}
          <div className="relative h-10 w-10 flex items-center justify-center md:hidden">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#1e293b" strokeWidth="4" />
              <circle 
                cx="18" cy="18" r="16" fill="none" stroke="#6366f1" strokeWidth="4" 
                strokeDasharray={`${progressPercentage}, 100`} strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{selectedIds.length}/3</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedIds.length === 0 || isLoading}
          className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold transition-all shadow-xl transform active:scale-95 ${
            selectedIds.length > 0 && !isLoading
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-indigo-500/20'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Przetwarzanie...
            </span>
          ) : 'Generuj Raport Główny'}
        </button>
      </div>
    </div>
  );
};

export default CompetitorSelector;