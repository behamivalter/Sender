import React, { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Send,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  HelpCircle,
  Activity,
  FileText,
  Mail,
  Layers,
  Gauge,
  Terminal,
  Settings,
  Check,
  Copy,
  ArrowRight,
  Smile,
  ShieldAlert,
  Sliders,
  Sparkle
} from "lucide-react";
import {
  SMTPConfig,
  SMTPStatus,
  Recipient,
  AIAnalysisReport,
  LogEntry,
  EmailCampaign
} from "./types";
import SMTPManager from "./components/SMTPManager";
import RecipientManager from "./components/RecipientManager";

// Seed initial SMTP servers so the user doesn't see a blank page
const initialSMTPs: SMTPConfig[] = [
  {
    id: "smtp-1",
    host: "smtp.mailgun.org",
    port: 587,
    secure: "tls",
    username: "marketing-rota-1@yourdomain.al",
    status: SMTPStatus.ACTIVE
  },
  {
    id: "smtp-2",
    host: "smtp.sendgrid.net",
    port: 465,
    secure: "ssl",
    username: "transactional-service@biznes.com",
    status: SMTPStatus.ACTIVE
  }
];

export default function App() {
  // --- APPLICATION STATE WITH LOCALSTORAGE PERSISTENCE ---
  const [smtpList, setSmtpList] = useState<SMTPConfig[]>(() => {
    const saved = localStorage.getItem("smtp_list");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialSMTPs;
  });

  const [emailInput, setEmailInput] = useState<string>(() => {
    const saved = localStorage.getItem("email_input");
    return saved !== null ? saved : "klienti1@gmail.com\nmarketing-test@yahoo.com\ninteresuar-failed@outlook.com\nbashkpuntor@kompani.al";
  });
  
  // Sandbox vs Real mode toggle (Defaults to FALSE so that user messages are sent via real SMTP immediately)
  const [sandboxMode, setSandboxMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("sandbox_mode");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Email Campaign Configs
  const [campaign, setCampaign] = useState<EmailCampaign>(() => {
    const saved = localStorage.getItem("email_campaign");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      subject: "Fito deri në 30% zbritje për shërbimet tona! 🚀",
      senderName: "Kompani Shembull Sh.p.k.",
      senderEmail: "",
      replyTo: "info@kompanishembull.al",
      bodyHTML: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #4f46e5; margin-bottom: 16px;">Përshëndetje [-emailuser-],</h2>
  <p style="color: #334155; line-height: 1.6;">Ne kemi kënaqësinë t'ju ofrojmë një mundësi të veçantë sot, më datë <strong>[-time-]</strong>.</p>
  <p style="color: #334155; line-height: 1.6;">Vetëm për ty, po dhurojmë zbritje ekskluzive për fushata dhe zhvillim softueri. Mos e humb këtë mundësi!</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="#" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Shfrytëzo Oferten Tani</a>
  </div>
  <hr style="border-top: 1px solid #e2e8f0;" />
  <p style="text-align: center; font-size: 11px; color: #64748b;">Nëse nuk dëshironi të merrni më e-maile, mund të rregulloni llogarinë tuaj në [-email-]. Kodi i referencës: [-randommd5-]</p>
</div>`,
      bodyPlain: `Përshëndetje [-emailuser-],

Ne kemi kënaqësinë t'ju ofrojmë një mundësi të veçantë sot, më datë [-time-].
Vetëm për ty, po dhurojmë zbritje ekskluzive për fushata dhe zhvillim softueri.

Shfrytëzo Oferten Tani: https://kompanishembull.al

Nëse nuk dëshironi të merrni më e-maile, shkruani në info@kompanishembull.al.
Kodi i referencës: [-randommd5-]`,
      messageType: "html",
      encodingType: "UTF-8",
      emailPriority: "3" // Normal
    };
  });

  // active send logs & stats
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    const saved = localStorage.getItem("email_logs");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "log-init",
        timestamp: new Date().toLocaleTimeString(),
        message: "Sistemi u inicializua me sukses në Regjimin REAL SMTP. Çdo dërgim dërgohet realisht në serverat e caktuar.",
        type: "info"
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<"fushata" | "smtp" | "spam" | "historiku">("fushata");

  // AI Content Writer Config
  const [aiTopic, setAiTopic] = useState<string>(() => {
    return localStorage.getItem("ai_topic") || "Prezantim i shërbimeve tona të reja të marketingut medialogjik me AI";
  });
  const [aiAudience, setAiAudience] = useState<string>(() => {
    return localStorage.getItem("ai_audience") || "Biznese të mesme dhe startup-e në mbarë rajonin";
  });
  const [aiTone, setAiTone] = useState<string>(() => {
    return localStorage.getItem("ai_tone") || "Profesionale por tërheqëse";
  });
  const [isGeneratingCopy, setIsGeneratingCopy] = useState<boolean>(false);

  // AI Spam Checker Config
  const [isAnalyzingSpam, setIsAnalyzingSpam] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<AIAnalysisReport | null>(() => {
    const saved = localStorage.getItem("ai_report");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return null;
  });

  // Email Delivery stats
  const [sendingInProgress, setSendingInProgress] = useState<boolean>(false);
  const [totalSentCount, setTotalSentCount] = useState<number>(120); // starts with mock history
  const [failedSentCount, setFailedSentCount] = useState<number>(4);
  const [activeStatusList, setActiveStatusList] = useState<Recipient[]>([]);

  // Clipboard notify state
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Log summary trigger
  const addLog = (message: string, type: "success" | "error" | "warning" | "info" = "info", smtpHost?: string) => {
    const newLog: LogEntry = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
      smtpHost
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // --- LOCALSTORAGE SAVE SYNCS ---
  useEffect(() => {
    localStorage.setItem("smtp_list", JSON.stringify(smtpList));
  }, [smtpList]);

  useEffect(() => {
    localStorage.setItem("email_input", emailInput);
  }, [emailInput]);

  useEffect(() => {
    localStorage.setItem("sandbox_mode", JSON.stringify(sandboxMode));
  }, [sandboxMode]);

  useEffect(() => {
    localStorage.setItem("email_campaign", JSON.stringify(campaign));
  }, [campaign]);

  useEffect(() => {
    localStorage.setItem("email_logs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("ai_topic", aiTopic);
  }, [aiTopic]);

  useEffect(() => {
    localStorage.setItem("ai_audience", aiAudience);
  }, [aiAudience]);

  useEffect(() => {
    localStorage.setItem("ai_tone", aiTone);
  }, [aiTone]);

  useEffect(() => {
    if (aiReport) {
      localStorage.setItem("ai_report", JSON.stringify(aiReport));
    } else {
      localStorage.removeItem("ai_report");
    }
  }, [aiReport]);

  // Pre-seed some default logs to make the visual load realistic and beautiful
  useEffect(() => {
    addLog("Komponentat AI janë gati për analizë të përparuar dhe optimizim.", "success");
  }, []);

  // Compute parsed clean emails from current address list
  const activeEmails = useMemo(() => {
    return emailInput
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));
  }, [emailInput]);

  // --- ACTIONS ---

  // Add new SMTP account configuration
  const handleAddSMTP = (config: Omit<SMTPConfig, "id" | "status" | "errorMessage">) => {
    const newSMTP: SMTPConfig = {
      ...config,
      id: `smtp-${Math.random().toString(36).substring(2, 9)}`,
      status: SMTPStatus.TESTING
    };
    setSmtpList((prev) => [...prev, newSMTP]);
    addLog(`U shtua një rrugë e re SMTP për transmetim: ${config.host}`, "info");

    // Dynamic verify trigger
    handleVerifySMTP(newSMTP.id);
  };

  // Remove SMTP from Rota
  const handleRemoveSMTP = (id: string) => {
    const target = smtpList.find(s => s.id === id);
    setSmtpList((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      addLog(`Rruga SMTP u largua nga Rota: ${target.host}`, "warning");
    }
  };

  // Request actual validation handshake from Node-server or Mock it
  const handleVerifySMTP = async (id: string): Promise<void> => {
    const hostSmtp = smtpList.find((s) => s.id === id);
    if (!hostSmtp) return;

    setSmtpList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: SMTPStatus.TESTING, errorMessage: undefined } : s))
    );

    try {
      const response = await fetch("/api/check-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: hostSmtp.host,
          port: hostSmtp.port,
          secure: hostSmtp.secure,
          username: hostSmtp.username,
          password: hostSmtp.password || "",
          sandboxMode
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSmtpList((prev) =>
          prev.map((s) => (s.id === id ? { ...s, status: SMTPStatus.ACTIVE } : s))
        );
        addLog(`Verifikimi i lidhjes pati suksese në SMTP: ${hostSmtp.host}`, "success");
      } else {
        throw new Error(data.error || "Handshake reject");
      }
    } catch (err: any) {
      setSmtpList((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: SMTPStatus.FAILED, errorMessage: err.message } : s))
      );
      addLog(`Dështoi lidhja me SMTP serverin ${hostSmtp.host}: ${err.message}`, "error");
    }
  };

  // AI Content Writer invocation
  const generateAICampaign = async () => {
    setIsGeneratingCopy(true);
    addLog("Inteligjenca artificiale po formulon skicën optimale të fushatës...", "info");
    try {
      const resp = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: aiTopic,
          audience: aiAudience,
          tone: aiTone,
          messageType: campaign.messageType
        })
      });

      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData.error || "Generation error");
      }

      const generated = await resp.json();
      setCampaign((prev) => ({
        ...prev,
        subject: generated.subject,
        bodyHTML: generated.bodyHTML,
        bodyPlain: generated.bodyPlain
      }));

      addLog("Kopja e re e fushatës u krijua me sukses nga Asistenti AI!", "success");
      
      // Auto triggers analysis of newly generated content
      triggerSpamAnalysis(generated.subject, generated.bodyHTML, generated.bodyPlain);
    } catch (error: any) {
      addLog(`Krijimi i shkrimit AI dështoi: ${error.message}`, "error");
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  // Transform current rich HTML directly into clean plaintext backup via AI
  const convertToPlaintextBackup = async () => {
    addLog("Po konvertohet drafti HTML në Plain-Text...", "info");
    try {
      const response = await fetch("/api/ai/text-alternative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyHTML: campaign.bodyHTML })
      });
      if (!response.ok) throw new Error("Conversion error");
      const data = await response.json();
      setCampaign(prev => ({ ...prev, bodyPlain: data.bodyPlain }));
      addLog("Alternative Plain-Text u formatua me sukses!", "success");
    } catch (err: any) {
      addLog(`Konvertimi dështoi: ${err.message}`, "error");
    }
  };

  // Spam score checking
  const triggerSpamAnalysis = async (
    sub = campaign.subject,
    html = campaign.bodyHTML,
    plain = campaign.bodyPlain
  ) => {
    setIsAnalyzingSpam(true);
    addLog("Rregullatori i Spam-it AI po kryen kontrolle dërgueshmërie...", "info");
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: sub,
          bodyHTML: html,
          bodyPlain: plain,
          messageType: campaign.messageType
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Audit failed");
      }

      const report: AIAnalysisReport = await response.json();
      setAiReport(report);
      addLog(`Analiza e Spam-it përfundoi! Rezultati: ${report.overallScore}/100, Rreziku: ${report.spamRisk.toUpperCase()}`, report.spamRisk === "low" ? "success" : "warning");
    } catch (error: any) {
      addLog(`Analiza e filtrit AI dështoi: ${error.message}`, "error");
    } finally {
      setIsAnalyzingSpam(false);
    }
  };

  // Campaign dispatcher
  const startBulkEmailDisptach = async () => {
    if (activeEmails.length === 0) {
      alert("Ju lutem specifikoni të paktën një marrës të vlefshëm për të filluar.");
      return;
    }

    const verifiedSmtps = smtpList.filter((s) => s.status === SMTPStatus.ACTIVE);
    if (verifiedSmtps.length === 0) {
      alert("Nuk ka asnjë SMTP aktive në Rota. Shtoni ose testoni rrugët për të vazhduar transmetimin.");
      return;
    }

    setSendingInProgress(true);
    addLog(`Nis dërgimi masiv i ${activeEmails.length} e-maileve duke përdorur Rota-n e SMTP-së...`, "info");

    const recipientsProgress: Recipient[] = activeEmails.map((email) => ({
      email,
      status: "pending"
    }));

    setActiveStatusList(recipientsProgress);
    setActiveTab("historiku"); // Go to monitor tab so users can see progress live

    const targetRecipients = [...activeEmails];

    // Dispatch loop sequentially to demonstrate automatic rotating SMTP failsafes
    for (let i = 0; i < targetRecipients.length; i++) {
      if (!sendingInProgress) {
        // Can be cancelled
      }

      const currentRecipient = targetRecipients[i];
      
      // Update state to 'sending'
      setActiveStatusList((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "sending" } : r))
      );

      let success = false;
      let lastErrorMessage = "";

      // Try sending with available active SMTP servers in a round-robin rotation,
      // failover to subsequent servers if an attempt fails.
      for (let attempt = 0; attempt < verifiedSmtps.length; attempt++) {
        const smtpIndex = (i + attempt) % verifiedSmtps.length;
        const selectedSmtp = verifiedSmtps[smtpIndex];

        addLog(`[Ura ${smtpIndex + 1}] Po dërgohet te ${currentRecipient} përmes ${selectedSmtp.host}...`, "info");

        try {
          const resp = await fetch("/api/campaign/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recipient: currentRecipient,
              smtpConfig: selectedSmtp,
              campaign,
              sandboxMode
            })
          });

          if (!resp.ok) {
            const errData = await resp.json();
            throw new Error(errData.error || "Sending rejected on pipeline.");
          }

          // Marking successfully sent
          setActiveStatusList((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: "sent", timestamp: new Date().toLocaleTimeString(), error: undefined } : r
            )
          );
          addLog(`✓ Dërguar me sukses tek: ${currentRecipient}`, "success", selectedSmtp.host);
          setTotalSentCount((prev) => prev + 1);

          // Remove the processed email from the top of the input list dynamically
          setEmailInput((prevInput) => {
            const lines = prevInput.split("\n");
            if (lines.length > 0) {
              lines.shift();
            }
            return lines.join("\n");
          });

          success = true;
          break; // Exit the attempt loop since it succeeded!
        } catch (err: any) {
          lastErrorMessage = err.message || "Failed";
          addLog(`⚠️ Dështoi përmes ${selectedSmtp.host}: ${lastErrorMessage}. Po provojmë SMTP tjetër në rradhë...`, "warning", selectedSmtp.host);
          
          // Throttling slightly before attempting another SMTP (500ms)
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      if (!success) {
        // If all available active SMTP servers failed
        setActiveStatusList((prev) =>
          prev.map((r, idx) =>
            idx === i ? { ...r, status: "failed", error: `Të gjitha SMTP dështuan: ${lastErrorMessage}`, timestamp: new Date().toLocaleTimeString() } : r
          )
        );
        addLog(`❌ Dështoi të dërgohej plotësisht tek ${currentRecipient}! Të gjitha ${verifiedSmtps.length} SMTP-të aktive dështuan.`, "error");
        setFailedSentCount((prev) => prev + 1);
      }

      // Small throttling delay to preserve SMTP sender reputation and give realistic visual progress
      await new Promise((r) => setTimeout(r, 900));
    }

    setSendingInProgress(false);
    addLog("U krye i gjithë procesi i transmetimit të fushatës masive.", "success");
  };

  const copyOptimizedSubject = () => {
    if (aiReport?.optimizedAlternativeSubject) {
      navigator.clipboard.writeText(aiReport.optimizedAlternativeSubject);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const receiversList = activeEmails;

  return (
    <div className="min-h-screen bg-gradient-mesh font-sans text-slate-700 antialiased selection:bg-indigo-100 selection:text-indigo-900 pb-12">
      {/* Premium Header Menu */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-lg font-bold tracking-tight text-slate-900">
                  Smart Campaign Hub
                </h1>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full uppercase">
                  AI v3.5 Optimized
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Transmetim i mbrojtur masiv me rrotullim SMTP dhe auditim Inteligjent të Spam-it.
              </p>
            </div>
          </div>

          {/* Quick Actions Global Stats */}
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 border border-slate-100 p-2 px-4 rounded-xl flex items-center gap-6">
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Total të Dërguara</span>
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {totalSentCount}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">Dështime (Bllokuar)</span>
                <span className="text-sm font-semibold text-rose-600 font-mono">
                  {failedSentCount}
                </span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold text-slate-400">SMTP në Rota</span>
                <span className="text-sm font-semibold text-emerald-600 font-mono">
                  {smtpList.filter(s => s.status === SMTPStatus.ACTIVE).length}/{smtpList.length}
                </span>
              </div>
            </div>

            <button
              onClick={startBulkEmailDisptach}
              disabled={sendingInProgress || receiversList.length === 0}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs tracking-wide rounded-xl shadow-md shadow-indigo-600/10 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Dërgo Fushaten ({receiversList.length})
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar & Left Work area: 8/12 of bento grid */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Bento Tab Buttons */}
          <div className="bg-white p-1 rounded-xl border border-slate-100 flex gap-1">
            <button
              onClick={() => setActiveTab("fushata")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "fushata"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Mail className="w-4 h-4" />
              1. Fushata & Shkrimi AI
            </button>
            <button
              onClick={() => setActiveTab("smtp")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "smtp"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Sliders className="w-4 h-4" />
              2. Marrësit & SMTP Rota
            </button>
            <button
              onClick={() => setActiveTab("spam")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
                activeTab === "spam"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              3. Auditimi AI i Spam-it
              {aiReport && aiReport.spamRisk !== "low" && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("historiku")}
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === "historiku"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Terminal className="w-4 h-4" />
              4. Monitori Live & Log
            </button>
          </div>

          {/* TAB 1: CAMPAGIN COMPOSITION & AI COPYWRITER WIZARD */}
          {activeTab === "fushata" && (
            <div className="space-y-6">
              
              {/* Premium Copywriter input */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
                <div className="absolute right-0 top-0 w-44 h-44 bg-indigo-50 rounded-full filter blur-3xl opacity-60 -z-1" />
                
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-bold text-xs flex items-center gap-1.5">
                    <Sparkle className="w-3.5 h-3.5 animate-pulse" />
                    AI Shkruesi i Fushatës
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800">Gjenero Kopje me klikim tek Gemini</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Cili është Subjekti/Tema?</label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="p.sh. Oferte 50% per stinen e veres ne programim"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Audience e Targetuar</label>
                    <input
                      type="text"
                      value={aiAudience}
                      onChange={(e) => setAiAudience(e.target.value)}
                      placeholder="p.sh. Studentet, Bizneset e mesme lokale"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-500">Toni:</span>
                    {["Tërheqës & Miqësor", "Profesional i Formatit", "Promovim i Ngutshëm"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setAiTone(t)}
                        className={`px-3 py-1 text-[11px] rounded-lg border font-medium transition-all cursor-pointer ${
                          aiTone === t
                            ? "bg-slate-800 text-white border-slate-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={generateAICampaign}
                    disabled={isGeneratingCopy}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingCopy ? "Duke u shkruar..." : "Gjenero Kopje AI"}
                  </button>
                </div>
              </div>

              {/* Email Content Draft view */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-bold text-slate-800">Makinëza e Fushatës</h3>
                    <p className="text-xs text-slate-400">Specifikoni parametrat e e-mailit dhe testoni variablat.</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Lloji i drafteve:</span>
                    <button
                      onClick={() => setCampaign(c => ({ ...c, messageType: "html" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        campaign.messageType === "html"
                          ? "bg-indigo-50 border border-indigo-100 text-indigo-700"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Formatted HTML
                    </button>
                    <button
                      onClick={() => setCampaign(c => ({ ...c, messageType: "plain" }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        campaign.messageType === "plain"
                          ? "bg-indigo-50 border border-indigo-100 text-indigo-700"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Plain Backups Only
                    </button>
                  </div>
                </div>

                {/* Sender Details Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Emri i Dërguesit</label>
                    <input
                      type="text"
                      value={campaign.senderName}
                      onChange={(e) => setCampaign(c => ({ ...c, senderName: e.target.value }))}
                      placeholder="Shembull Kompani Sh.p.k."
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">E-mail për Reply-To</label>
                    <input
                      type="text"
                      value={campaign.replyTo}
                      onChange={(e) => setCampaign(c => ({ ...c, replyTo: e.target.value }))}
                      placeholder="marketing@domain.al"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Prioriteti i dërgimit</label>
                    <select
                      value={campaign.emailPriority}
                      onChange={(e) => setCampaign(c => ({ ...c, emailPriority: e.target.value as any }))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40 cursor-pointer"
                    >
                      <option value="">Normal (Parazgjedhur)</option>
                      <option value="1">Lartë (High Priority)</option>
                      <option value="5">Ulët (Low Priority)</option>
                    </select>
                  </div>
                </div>

                {/* Campaign Subject input */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Titulli / Subjekti i E-mailit</label>
                  <input
                    type="text"
                    value={campaign.subject}
                    onChange={(e) => setCampaign(c => ({ ...c, subject: e.target.value }))}
                    placeholder="Shtoni këtë temë..."
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline_none focus:ring-1 focus:ring-indigo-600 bg-slate-50/40 text-slate-800"
                  />
                </div>

                {campaign.messageType === "html" ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-slate-600">Draft Layout HTML</label>
                        <button
                          onClick={convertToPlaintextBackup}
                          className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold uppercase transition-all"
                        >
                          Klikoni për Backup-Plaintext AI automatik
                        </button>
                      </div>
                      <textarea
                        value={campaign.bodyHTML}
                        onChange={(e) => setCampaign(c => ({ ...c, bodyHTML: e.target.value }))}
                        rows={12}
                        className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-600 focus:outline_none bg-slate-900 text-slate-100"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Drafti Plain-Text (Alternative)</label>
                    <textarea
                      value={campaign.bodyPlain}
                      onChange={(e) => setCampaign(c => ({ ...c, bodyPlain: e.target.value }))}
                      rows={12}
                      className="w-full text-xs font-mono p-4 rounded-xl border border-slate-200 focus:ring-1 focus:ring-indigo-600 focus:outline_none bg-slate-50 text-slate-800"
                    />
                  </div>
                )}

                {/* Variable Cheatsheet block */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-2xs font-mono">
                  <div>
                    <span className="text-slate-400 block font-sans">E-maili i marrësit:</span>
                    <span className="text-indigo-600 font-bold">[-email-]</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans font-medium">Pjesa para @:</span>
                    <span className="text-indigo-600 font-bold">[-emailuser-]</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Koha/Ora:</span>
                    <span className="text-indigo-600 font-bold">[-time-]</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-sans">Hash unik MD5:</span>
                    <span className="text-indigo-600 font-bold">[-randommd5-]</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => triggerSpamAnalysis()}
                    disabled={isAnalyzingSpam}
                    className="py-2.5 px-4 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    {isAnalyzingSpam ? "Duke u audituar..." : "Audito Rrezikun e Spam-it"}
                  </button>

                  <button
                    onClick={() => setActiveTab("smtp")}
                    className="py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    Vazhdo me Marrësit & SMTP Rota
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RECIPIENT LIST & SMTP ROTA SETUP */}
          {activeTab === "smtp" && (
            <div className="grid grid-cols-1 gap-6">
              <RecipientManager
                emailInput={emailInput}
                onChangeEmails={setEmailInput}
              />
              <SMTPManager
                smtpList={smtpList}
                onAddSMTP={handleAddSMTP}
                onRemoveSMTP={handleRemoveSMTP}
                onVerifySMTP={handleVerifySMTP}
                sandboxMode={sandboxMode}
                setSandboxMode={setSandboxMode}
              />
            </div>
          )}

          {/* TAB 3: SPAM RISK INSIGHT AUDIT */}
          {activeTab === "spam" && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
                  🛡️ Spam Compliance Audit Report
                </h3>
                <p className="text-xs text-slate-500">
                  Rezultati dhe analiza vjen direkt nga inteligjenca Gemini duke testuar barrierat e filtrave (Gmail, Outlook, SpamAssassin).
                </p>
              </div>

              {!aiReport ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-dashed">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Nuk ka asnjë raport të auditimit aktiv. Klikoni butonin më poshtë për të skanuar subjektin dhe trupin e e-mailit.
                  </p>
                  <button
                    onClick={() => triggerSpamAnalysis()}
                    disabled={isAnalyzingSpam}
                    className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingSpam ? "animate-spin" : ""}`} />
                    {isAnalyzingSpam ? "Duke analizuar strukturën..." : "Nis Auditimin me AI"}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Score Bento Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <div className="border rounded-2xl p-5 text-center bg-slate-50/50">
                      <span className="block text-2xs uppercase font-bold tracking-wider text-slate-400">Puntimi i Cilësisë</span>
                      <span className="block text-4xl font-display font-extrabold text-indigo-600 mt-2">
                        {aiReport.overallScore}/100
                      </span>
                      <span className="inline-block mt-2 text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                        Ere e mbrojtur
                      </span>
                    </div>

                    <div className="border rounded-2xl p-5 text-center bg-slate-50/50">
                      <span className="block text-2xs uppercase font-bold tracking-wider text-slate-400">Rreziku i Spam-it</span>
                      <span className={`block text-3xl font-display font-bold mt-3 uppercase ${
                        aiReport.spamRisk === "low"
                          ? "text-emerald-600"
                          : aiReport.spamRisk === "medium"
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}>
                        {aiReport.spamRisk === "low" ? "Low Risk" : aiReport.spamRisk === "medium" ? "Kujdes" : "High Risk"}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">Probabiliteti i Inbox Routing</span>
                    </div>

                    <div className="border rounded-2xl p-5 text-center bg-slate-50/50">
                      <span className="block text-2xs uppercase font-bold tracking-wider text-slate-400">Sensi i Spam-it</span>
                      <span className="block text-2xl font-semibold text-slate-700 mt-3 font-mono">
                        {aiReport.spamScore} / 10
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1">Më i lartë = Më rrezik</span>
                    </div>

                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block">Sintonizimi (Sentiment):</span>
                      <span className="font-semibold text-slate-700">{aiReport.sentiment}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Toni i Shkrimit:</span>
                      <span className="font-semibold text-slate-700">{aiReport.tone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lexueshmëria (Readability):</span>
                      <span className="font-semibold text-slate-700 font-mono">{aiReport.readabilityGrade}</span>
                    </div>
                  </div>

                  {/* Optimized Subject recommendation */}
                  {aiReport.optimizedAlternativeSubject && (
                    <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          Subjekti i Optimizuar me AI (Open Safe & Trustworthy)
                        </span>
                        <button
                          onClick={copyOptimizedSubject}
                          className="text-[10px] bg-white border hover:bg-slate-50 p-1 px-2.5 rounded-lg flex items-center gap-1 font-semibold text-slate-600 transition-all cursor-pointer"
                        >
                          {copiedText ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              Kopjuar!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Kopjo Kopjen
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 bg-white p-2 px-3 rounded-lg border font-mono">
                        {aiReport.optimizedAlternativeSubject}
                      </p>
                    </div>
                  )}

                  {/* Triggers and Suggestions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        Triggers të dyshimtë të gjetur ({aiReport.foundSpamTriggers.length})
                      </h4>
                      {aiReport.foundSpamTriggers.length === 0 ? (
                        <p className="text-xs text-emerald-600 font-semibold italic">✓ Skaner i pastër! Nuk u gjet asnjë fjalë kyçe e padëshiruar.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {aiReport.foundSpamTriggers.map((trig, index) => (
                            <li key={index} className="text-xs bg-rose-50 text-rose-800 rounded px-2.5 py-1 font-mono flex items-center gap-1.5 border border-rose-100/30">
                              <span className="w-1 h-1 bg-rose-500 rounded-full" />
                              {trig}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <Sliders className="w-4 h-4 text-indigo-500" />
                        Këshilla për përmirësim AI ({aiReport.suggestions.length})
                      </h4>
                      <ul className="space-y-2">
                        {aiReport.suggestions.map((sug, index) => (
                          <li key={index} className="text-xs text-slate-600 pl-4 relative">
                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                            {sug}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => triggerSpamAnalysis()}
                      disabled={isAnalyzingSpam}
                      className="py-2 px-4 bg-slate-800 hover:bg-slate-900 border text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzingSpam ? "animate-spin" : ""}`} />
                      Klikoni për të sërish Skanuar
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 4: DISPATCH STATUS & LIVE LOGS */}
          {activeTab === "historiku" && (
            <div className="space-y-6">
              
              {/* Active Delivery Status table */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
                <div className="border-b border-slate-100 pb-4 mb-4">
                  <h3 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
                    📊 Monitori i Statusit të Transmetimit
                  </h3>
                  <p className="text-xs text-slate-500">Marrësit aktivë të radhës dhe vendimi i fundit i transmetimit.</p>
                </div>

                {activeStatusList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Nuk ka asnjë fushatë dërgimi të nisur në këtë sesion. Plotësoni marrësit dhe klikoni &quot;Dërgo Fushaten&quot;.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5">E-maili</th>
                          <th className="py-2.5">Statusi</th>
                          <th className="py-2.5">Koha</th>
                          <th className="py-2.5">Gjurma / Gabimi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs">
                        {activeStatusList.map((rec, index) => (
                          <tr key={index}>
                            <td className="py-2.5 font-mono text-slate-700">{rec.email}</td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                rec.status === "sent"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : rec.status === "failed"
                                  ? "bg-rose-50 text-rose-700"
                                  : rec.status === "sending"
                                  ? "bg-indigo-50 text-indigo-700 animate-pulse"
                                  : "bg-slate-100 text-slate-600"
                              }`}>
                                {rec.status === "sent" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                {rec.status === "failed" && <XCircle className="w-3 h-3 text-rose-500" />}
                                {rec.status}
                              </span>
                            </td>
                            <td className="py-2.5 text-slate-500 font-mono">{rec.timestamp || "--:--:--"}</td>
                            <td className="py-2.5 truncate max-w-[200px] text-slate-500 font-mono" title={rec.error}>
                              {rec.error || "Nuk u gjet asnjë pengesë raporti"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Server Live terminal logs */}
              <div className="bg-slate-900 rounded-2xl p-6 text-slate-300 font-mono text-xs border border-slate-800 relative">
                <div className="absolute right-4 top-4 hover:bg-slate-800 p-1 rounded cursor-pointer" onClick={() => setLogs([])}>
                  Pastro Terminalin
                </div>
                <h4 className="text-slate-400 text-2xs uppercase tracking-wider font-sans font-bold border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Terminal Console Feed
                </h4>

                <div className="space-y-1.5 h-64 overflow-y-auto pr-2 scrollbar-none">
                  {logs.map((lg) => (
                    <div key={lg.id} className="leading-5">
                      <span className="text-slate-600">[{lg.timestamp}]</span>{" "}
                      {lg.smtpHost && (
                        <span className="text-indigo-400 font-semibold bg-indigo-950/40 px-1 py-0.5 rounded mr-1">
                          {lg.smtpHost}
                        </span>
                      )}
                      <span className={` ${
                        lg.type === "success"
                          ? "text-emerald-400"
                          : lg.type === "error"
                          ? "text-rose-400"
                          : lg.type === "warning"
                          ? "text-amber-400"
                          : "text-slate-300"
                      }`}>
                        {lg.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Bento Grid Right Panel: Quick Actions/Compliance summary - 4/12 width */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Advisor Card widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2">
              💡 Asistenti i Strategjisë AI
            </h3>

            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative">
                <span className="font-bold block text-slate-800 mb-1">Qarkullimi Automat me Rota</span>
                Kur keni shumë adresa në radhë, sistemi bën rotacion automatikisht ndërmjet lidhjeve tuaja aktive SMTP. Kjo shmang limitet e shpeshta të ofruesit.
              </div>

              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <span className="font-bold block text-slate-800 mb-1">Rekomandim dërgimi</span>
                Të dhënat tuaja të fushatës HTML optimizohen në kohë reale. Ju sugjerojmë të plotësoni variablat e backup-it plain-text për të shmangur tabin “Promo” në Gmail.
              </div>

              <div className="p-3 bg-indigo-50/25 border border-indigo-100/50 rounded-xl text-indigo-900">
                <span className="font-bold block text-indigo-950 mb-1">Si të dërgoj me SMTP real?</span>
                Shkoni te tabi <strong>2. Marrësit & SMTP Rota</strong> dhe çaktivizoni regjimin Sandbox. Shtoni kredencialet e Mailgun, SendGrid ose smtp-n tuaj private për transmetime të sakta. Emri i dërguesit mbrohet.
              </div>
            </div>
          </div>

          {/* Quick Stats Summary widget */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-800">
              📉 Statistikat Globale të Dorëzimit
            </h3>

            <div className="space-y-3 font-mono text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Sukses:</span>
                <span className="text-emerald-600 font-bold">96.8%</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[96.8%]" />
              </div>

              <div className="flex justify-between">
                <span>Shmangia e SpamFilters:</span>
                <span className="text-indigo-600 font-bold">91.4%</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full w-[91.4%]" />
              </div>

              <div className="flex justify-between">
                <span>Shkalla e Hapur (Avg Open Rate):</span>
                <span className="text-slate-800 font-bold">42.5%</span>
              </div>
              <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                <div className="bg-slate-700 h-full w-[42.5%]" />
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
