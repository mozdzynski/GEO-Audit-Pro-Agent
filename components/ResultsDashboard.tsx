import React, { useState } from 'react';
import { AuditData, ReportSection } from '../types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { jsPDF } from 'jspdf';

interface ResultsDashboardProps {
  data: AuditData;
  onReset: () => void;
}

const SimpleMarkdown = ({ text }: { text: string }) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-semibold text-indigo-200">{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </div>
  );
};

const SectionCard: React.FC<{ section: ReportSection }> = ({ section }) => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-indigo-500/30 transition-colors mb-6 shadow-md">
    <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">{section.title}</h3>
    <SimpleMarkdown text={section.content} />
  </div>
);

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ data, onReset }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'tech' | 'sales'>('main');

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4ade80';
    if (score >= 50) return '#facc15';
    return '#f87171';
  };

  /**
   * Enhanced Polish character sanitizer for standard jsPDF fonts.
   */
  const sanitizeTextForPDF = (input: string): string => {
    if (!input) return "";
    
    const mapping: Record<string, string> = {
      'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
      'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
    };
    
    let text = input.replace(/\*\*/g, '');
    text = text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, m => mapping[m] || m);
    text = text.replace(/[^\x20-\x7E\r\n]/g, ""); 
    
    return text;
  };

  const generatePDF = (type: 'main' | 'tech' | 'sales') => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    const margin = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    let y = 0;
    let pageCount = 1;

    const drawHeader = () => {
      // Clean Header Background
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      // Branding text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('GEO AUDIT PRO AGENT', margin, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(sanitizeTextForPDF(`AUDYT DLA: ${data.companyName.toUpperCase()}`), margin, 26);
      doc.text(sanitizeTextForPDF(`DATA RAPORTU: ${new Date().toLocaleDateString('pl-PL')}`), pageWidth - margin, 26, { align: 'right' });
      
      // Indigo separator line
      doc.setDrawColor(79, 70, 229); 
      doc.setLineWidth(1.5);
      doc.line(0, 40, pageWidth, 40);

      // Page Number at bottom
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`Strona ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
    };

    const addNewPage = () => {
      doc.addPage();
      pageCount++;
      drawHeader();
      y = 55;
    };

    const addText = (text: string, size: number = 10, isBold: boolean = false, color: [number, number, number] = [31, 41, 55], spacing: number = 6) => {
      const cleanStr = sanitizeTextForPDF(text);
      doc.setFontSize(size);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setTextColor(color[0], color[1], color[2]);
      const lines = doc.splitTextToSize(cleanStr, pageWidth - (margin * 2));
      lines.forEach((line: string) => {
        if (y > 275) addNewPage();
        doc.text(line, margin, y);
        y += (size * 0.45) + 2;
      });
      y += spacing;
    };

    const addSectionTitle = (title: string, color: [number, number, number] = [79, 70, 229]) => {
      if (y > 250) addNewPage();
      y += 8;
      
      // Minimalistic Marker (Safe - doesn't overlap text)
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(0.8);
      doc.line(margin, y - 5, margin + 10, y - 5);
      
      addText(title.toUpperCase(), 12, true, color, 6);
      
      // Light bottom border for the section title
      doc.setDrawColor(240, 240, 240);
      doc.setLineWidth(0.1);
      doc.line(margin, y - 2, pageWidth - margin, y - 2);
      y += 2;
    };

    // START REPORT GENERATION
    drawHeader();
    y = 55;

    const reportHeaders = {
      main: 'RAPORT STRATEGICZNY: WIDOCZNOSC I REPUTACJA AI',
      tech: 'RAPORT TECHNICZNY: OPTYMALIZACJA DANYCH I RAG',
      sales: 'RAPORT BIZNESOWY: POTENCJAL I TEASER SPRZEDAZOWY'
    };

    // Subtitle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(reportHeaders[type], margin, y);
    y += 10;

    // Safe Score Summary (No background box to avoid overlap issues)
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('OGOLNY WSKAZNIK AI WIDOCZNOSCI:', margin, y);
    
    const score = data.overallScore;
    const scoreColor = score >= 80 ? [74, 222, 128] : (score >= 50 ? [210, 160, 0] : [200, 50, 50]);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(24);
    doc.text(`${score}%`, margin, y + 10);
    
    y += 18;
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    if (type === 'main') {
      addSectionTitle('EXECUTIVE DASHBOARD');
      addText(data.executiveSummary, 10, false, [51, 65, 85], 10);
      
      data.mainReportSections.forEach(section => {
        addSectionTitle(section.title);
        addText(section.content, 10, false, [51, 65, 85], 10);
      });
      
      if (data.competitorComparison) {
        addSectionTitle('ANALIZA POROWNAWCZA KONKURENCJI', [30, 41, 59]);
        data.competitorComparison.forEach(comp => {
          addText(`${comp.competitorName.toUpperCase()}: ${comp.score}%`, 11, true, [79, 70, 229], 2);
          addText(comp.keyDifference, 9, false, [71, 85, 105], 6);
        });
      }
    } else if (type === 'tech') {
      data.technicalReportSections.forEach(section => {
        addSectionTitle(section.title, [37, 99, 235]);
        addText(section.content, 9, false, [51, 65, 85], 10);
      });
    } else {
      data.salesTeaserSections.forEach(section => {
        addSectionTitle(section.title, [147, 51, 234]);
        addText(section.content, 10, false, [51, 65, 85], 10);
      });
    }

    // Disclaimer at fixed bottom position
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(sanitizeTextForPDF('Raport wygenerowany automatycznie przez GEO Pro Agent. Dane maja charakter analityczny.'), margin, 288);

    doc.save(`Raport_GEO_${data.companyName.replace(/\s+/g, '_')}_${type}.pdf`);
  };

  const comparisonData = [
    { name: 'Ty', score: data.overallScore },
    ...(data.competitorComparison?.map(c => ({ name: c.competitorName, score: c.score })) || [])
  ];

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-2xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-3">{data.companyName}</h1>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <h4 className="text-indigo-400 text-xs font-bold uppercase mb-2 tracking-widest">Executive Dashboard</h4>
            <p className="text-slate-300 text-sm leading-relaxed">{data.executiveSummary}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-[180px]">
          <div className="relative h-40 w-40 flex items-center justify-center">
            <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
              <path stroke={getScoreColor(data.overallScore)} strokeDasharray={`${data.overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="4" strokeLinecap="round" className="transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-extrabold text-white">{data.overallScore}%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">AI Readiness</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 mb-8 gap-4 sticky top-[73px] bg-slate-900 z-40 py-2">
        <div className="flex overflow-x-auto w-full md:w-auto gap-2 no-scrollbar">
          {[
            { id: 'main', label: 'Raport Strategiczny', icon: '📊' },
            { id: 'tech', label: 'Audyt Techniczny (SEO)', icon: '⚙️' },
            { id: 'sales', label: 'Sales Teaser', icon: '🚀' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 font-semibold text-sm transition-all whitespace-nowrap rounded-t-lg flex items-center gap-2 border-b-4 ${
                activeTab === tab.id ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => generatePDF(activeTab)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold rounded-xl transition-all border border-slate-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Eksportuj Widok
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {activeTab === 'main' && (
            <div className="space-y-6 animate-fade-in-up">
              {data.competitorComparison && data.competitorComparison.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                    Analiza Konkurencji
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {data.competitorComparison.map((comp, idx) => (
                      <div key={idx} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 hover:border-slate-500 transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-bold text-slate-100 truncate text-sm">{comp.competitorName}</h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${getScoreColor(comp.score) === '#4ade80' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                            {comp.score}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">"{comp.keyDifference}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.mainReportSections.map((section, idx) => (
                <SectionCard key={idx} section={section} />
              ))}
            </div>
          )}
          {activeTab === 'tech' && (
            <div className="space-y-6 animate-fade-in-up">
              {data.technicalReportSections.map((section, idx) => (
                <SectionCard key={idx} section={section} />
              ))}
            </div>
          )}
          {activeTab === 'sales' && (
            <div className="space-y-6 animate-fade-in-up">
              {data.salesTeaserSections.map((section, idx) => (
                <SectionCard key={idx} section={section} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl overflow-hidden">
            <h3 className="text-white font-bold mb-6 text-center text-sm uppercase tracking-widest text-slate-400">Północna Gwiazda GEO</h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.spiderChartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Twoja Firma" dataKey="score" stroke="#818cf8" strokeWidth={3} fill="#6366f1" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl bg-gradient-to-b from-slate-800 to-slate-900/50">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="text-indigo-400">⚡</span> Akcje Raportu
            </h3>
            <div className="space-y-4">
              <button
                onClick={() => generatePDF('main')}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Pobierz Raport Główny (PDF)
              </button>
              
              <button
                onClick={onReset}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl transition-all border border-slate-600"
              >
                Nowy Audyt
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-700">
               <p className="text-[10px] text-slate-500 leading-tight">
                 * Raport Główny zawiera Executive Dashboard, Symulację AI View, Analizę Konkurencji oraz 7 Filarów Optymalizacji.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;