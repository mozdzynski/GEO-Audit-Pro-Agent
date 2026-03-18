export interface Competitor {
  id: string;
  name: string;
  website: string;
  businessType: string;
  estimatedScore: number;
}

export interface SpiderChartMetric {
  subject: string;
  score: number;
  fullMark: number;
}

export interface ReportSection {
  title: string;
  content: string; // Markdown/Text content
}

export interface AuditData {
  companyName: string;
  overallScore: number;
  executiveSummary: string;
  spiderChartData: SpiderChartMetric[];
  mainReportSections: ReportSection[];
  technicalReportSections: ReportSection[];
  salesTeaserSections: ReportSection[];
  competitorComparison?: {
    competitorName: string;
    score: number;
    keyDifference: string;
  }[];
}

export interface FormInput {
  companyName: string;
  city: string;
  industry: string;
  website: string;
}

export enum AppState {
  IDLE = 'IDLE',
  FETCHING_COMPETITORS = 'FETCHING_COMPETITORS',
  SELECTING_COMPETITORS = 'SELECTING_COMPETITORS',
  GENERATING_REPORT = 'GENERATING_REPORT',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}