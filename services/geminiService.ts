import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GEO_AGENT_SYSTEM_INSTRUCTION } from '../constants';
import { AuditData, FormInput, Competitor } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Step 1: Find potential competitors using Google Search Grounding
 */
export const fetchCompetitors = async (input: FormInput): Promise<Competitor[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Znajdź 8-10 GŁÓWNYCH I BEZPOŚREDNICH konkurentów dla firmy "${input.companyName}" zlokalizowanej w miejscowości "${input.city}".
      
      KONTEKST DZIAŁALNOŚCI:
      - Branża/Nisza: ${input.industry}
      - Witryna: ${input.website}

      KRYTERIA DOBORU KONKURENCJI:
      1. SZUKAJ TYLKO KONKURENCJI BEZPOŚREDNIEJ: Jeśli firma to siłownia/fitness, szukaj innych lokalnych siłowni, klubów fitness i centrów sportowych.
      2. LOKALIZACJA: Priorytetyzuj firmy z "${input.city}" i najbliższych okolic (promień ok. 15-20km).
      3. RÓŻNORODNOŚĆ: Uwzględnij zarówno lokalne, niezależne kluby, jak i inne popularne sieci fitness działające w tym mieście.
      4. REALNE DANE: Podaj nazwę, typ działalności pasujący do niszy oraz przypisz realistyczny 'AI Visibility Score' (0-100).
      5. ID: Wygeneruj unikalne ID dla każdego konkurenta (np. slug nazwy).

      Zwróć listę w formacie JSON. Upewnij się, że każda pozycja ma adres URL strony internetowej (jeśli go nie znajdziesz, podaj link do profilu w Google Maps lub Facebooku).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
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
            required: ["id", "name", "website", "businessType", "estimatedScore"]
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
      model: 'gemini-3.1-pro-preview',
      contents: `Wykonaj pełny, ROZBUDOWANY audyt GEO dla firmy:
      - Nazwa: ${input.companyName}
      - Miasto: ${input.city}
      - Branża: ${input.industry}
      - URL: ${input.website}

      W sekcji Analiza Konkurencji porównaj firmę z następującymi wybranymi specjalistami z branży ${input.industry}:
      ${competitorsText}

      WYMAGANIA DOTYCZĄCE TREŚCI:
      1. RAPORT MUSI BYĆ EKSTREMALNIE SZCZEGÓŁOWY I EKSPERCKI. Każda sekcja w tablicach (mainReportSections, technicalReportSections, salesTeaserSections) musi zawierać:
         - Minimum 2-3 akapity merytorycznego opisu (min. 600-800 znaków na sekcję).
         - Listę punktowaną z konkretnymi faktami lub brakami (min. 5 punktów).
         - Podsekcję "REKOMENDACJE TECHNICZNE" z listą konkretnych kroków do wdrożenia.
      2. Techniczny audyt (technicalReportSections) MUSI zawierać gotowe do skopiowania fragmenty kodu JSON-LD (Schema.org) oraz przykłady struktur tabel HTML zoptymalizowanych pod LLM.
      3. Analiza E-E-A-T musi być bezlitosna i oparta na faktach ze strony ${input.website} oraz danych z Google Maps (opinie, NAP).
      4. Używaj terminologii profesjonalnej: "Vector Embeddings", "Knowledge Graph", "Semantic Triples", "RAG Optimization", "Entity Linking".
      5. W sekcji Sales Teaser używaj języka korzyści i strat (FOMO), pokazując realne ryzyko utraty rynku na rzecz konkurencji z lepszym wynikiem AI.
      6. Każdy tytuł sekcji musi być unikalny i profesjonalny.
      7. Upewnij się, że JSON jest poprawnie sformatowany, kompletny i nie zawiera błędów składniowych.`,
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