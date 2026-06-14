export enum SMTPStatus {
  ACTIVE = "ACTIVE",
  FAILED = "FAILED",
  TESTING = "TESTING"
}

export interface SMTPConfig {
  id: string;
  host: string;
  port: number;
  secure: "ssl" | "tls" | "none";
  username: string;
  password?: string;
  status: SMTPStatus;
  errorMessage?: string;
}

export interface Recipient {
  email: string;
  status: "pending" | "sent" | "failed" | "sending";
  timestamp?: string;
  error?: string;
}

export interface AIAnalysisReport {
  overallScore: number; // 0-100 overall score (representing quality and safety)
  spamRisk: "low" | "medium" | "high";
  spamScore: number; // 1-10 (10 is very high risk of spam folder routing)
  sentiment: string;
  tone: string;
  readabilityGrade: string;
  foundSpamTriggers: string[];
  suggestions: string[];
  optimizedAlternativeSubject?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  smtpHost?: string;
}

export interface SendingStats {
  totalSent: number;
  cycleSent: number;
  limit: number;
  remainingLimit: number;
  blockedUntil: string | null; // ISO Timestamp or null
  lastEmailTime: string | null;  // ISO string
  resetInactivityMinutes: number;
  cooldownMinutes: number;
}

export interface EmailCampaign {
  subject: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  bodyHTML: string;
  bodyPlain: string;
  messageType: "html" | "plain";
  encodingType: "UTF-8" | "ISO-8859-1";
  emailPriority: "1" | "3" | "5" | ""; // High, Normal, Low, Default
}
