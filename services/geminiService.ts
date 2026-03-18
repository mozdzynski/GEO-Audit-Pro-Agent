import { GoogleGenAI, Type } from "@google/genai";
import { GEO_AGENT_SYSTEM_INSTRUCTION } from '../constants';
import { AuditData, FormInput, Competitor } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Find potential competitors using Google Search Grounding
 */
export const fetchCompetitors = async (input: FormInput): Promise<Competitor[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Znajdź 8-10 GŁÓWNYCH I BEZPOŚREDNICH konkurentów dla firmy "${input.companyName}" zlokalizowanej w miejscowości "${input.city}".
      
      KONTEKST DZIAŁALNOŚCI:
      - Branża/Nisza: ${input.industry}
      - Witryna: ${input.website}

      KRYTERIA DOBORU KONKURENCJI:
      1. SZUKAJ TYLKO KONKURENCJI BEZPOŚREDNIEJ: Jeśli firma to "${input.industry}", szukaj innych lokalnych firm o DOKŁADNIE tym samym profilu.
      2. ABSOLUTNIE WYKLUCZ: Wielkie sieci handlowe i markety budowlane.
      3. LOKALIZACJA: Priorytetyzuj firmy z "${input.city}" i okolic (promień ok. 20-30km).
      4. REALNE DANE: Podaj nazwę, typ działalności pasujący do niszy oraz przypisz realistyczny 'AI Visibility Score' (0-100).

      Zwróć listę w formacie JSON.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2000 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              website: { type: Type.STRING },
              businessType: { type: Type.STRING },
              estimatedScore: { type: Type.NUMBER }
            },
            required: ["id", "name", "businessType", "estimatedScore"]
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as Competitor[];
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch competitors", error);
    throw error;
  }
};

/**
 * Step 2: Generate the final deep audit report
 */
export const runFinalAudit = async (input: FormInput, selectedCompetitors: Competitor[]): Promise<AuditData> => {
  const systemInstructionText = JSON.stringify(GEO_AGENT_SYSTEM_INSTRUCTION);
  const competitorsText = selectedCompetitors.map(c => `- ${c.name} (Wynik AI: ${c.estimatedScore}%)`).join('\n');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Wykonaj pełny, ROZBUDOWANY audyt GEO dla firmy:
      - Nazwa: ${input.companyName}
      - Miasto: ${input.city}
      - Branża: ${input.industry}
      - URL: ${input.website}

      W sekcji Analiza Konkurencji porównaj firmę z następującymi wybranymi specjalistami z branży ${input.industry}:
      ${competitorsText}

      WYMAGANIA DOTYCZĄCE TREŚCI:
      1. RAPORT MUSI BYĆ BARDZO SZCZEGÓŁOWY. Każda sekcja powinna zawierać min. 5-8 rozbudowanych zdań oraz listy wypunktowane.
      2. Techniczny audyt musi zawierać konkretne przykłady kodu JSON-LD i poprawnej struktury tabeli.
      3. Analiza E-E-A-T musi odnosić się do konkretnych braków lub atutów znalezionych na stronie ${input.website}.
      4. Nie używaj ogólników typu "popraw SEO". Pisz o "optymalizacji atrybutów dla wektorowych baz danych" i "semantycznym linkowaniu".
      5. Upewnij się, że JSON jest poprawnie sformatowany i kompletny.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: systemInstructionText,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 6000 }, // Zwiększony budżet na głębszą analizę
        maxOutputTokens: 20000, 
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyName: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            executiveSummary: { type: Type.STRING },
            spiderChartData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  fullMark: { type: Type.NUMBER }
                },
                required: ["subject", "score", "fullMark"]
              }
            },
            mainReportSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            technicalReportSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            salesTeaserSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "content"]
              }
            },
            competitorComparison: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  competitorName: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  keyDifference: { type: Type.STRING }
                },
                required: ["competitorName", "score", "keyDifference"]
              }
            }
          },
          required: [
            "companyName", 
            "overallScore", 
            "executiveSummary", 
            "spiderChartData", 
            "mainReportSections", 
            "technicalReportSections", 
            "salesTeaserSections",
            "competitorComparison"
          ]
        }
      }
    });

    const text = response.text;
    if (text) {
      try {
        return JSON.parse(text) as AuditData;
      } catch (e) {
        console.error("JSON Parse Error. Partial response text length:", text.length);
        throw new Error("Otrzymano nieprawidłowy format danych od AI. Spróbuj ponownie.");
      }
    }
    throw new Error("Brak odpowiedzi od modelu AI.");
  } catch (error) {
    console.error("Final audit failed", error);
    throw error;
  }
};