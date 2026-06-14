import React, { useState } from "react";
import { SMTPConfig, SMTPStatus } from "../types";
import { Plus, Trash2, CheckCircle2, XCircle, RefreshCw, AlertTriangle, HelpCircle } from "lucide-react";

interface SMTPManagerProps {
  smtpList: SMTPConfig[];
  onAddSMTP: (config: Omit<SMTPConfig, "id" | "status" | "errorMessage">) => void;
  onRemoveSMTP: (id: string) => void;
  onVerifySMTP: (id: string) => Promise<void>;
  sandboxMode: boolean;
  setSandboxMode: (mode: boolean) => void;
}

export default function SMTPManager({
  smtpList,
  onAddSMTP,
  onRemoveSMTP,
  onVerifySMTP,
  sandboxMode,
  setSandboxMode
}: SMTPManagerProps) {
  // Local state for the add form
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState<"ssl" | "tls" | "none">("tls");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testingId, setTestingId] = useState<string | null>(null);

  // Bulk add states
  const [addMethod, setAddMethod] = useState<"single" | "bulk">("single");
  const [bulkInput, setBulkInput] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !username || !password) return;
    onAddSMTP({ host, port, secure, username, password });
    
    // Reset form after submit
    setHost("");
    setPort(587);
    setSecure("tls");
    setUsername("");
    setPassword("");
  };

  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;

    const lines = bulkInput.split("\n");
    let addedCount = 0;
    let failedLines = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Format is host:port:secure:user:pass
      const parts = line.split(":");
      if (parts.length >= 5) {
        const parsedHost = parts[0].trim();
        const parsedPort = parseInt(parts[1].trim(), 10);
        const seqVal = parts[2].trim().toLowerCase();
        const secure: "tls" | "ssl" | "none" =
          seqVal === "ssl" ? "ssl" : (seqVal === "tls" ? "tls" : "none");
        const username = parts[3].trim();
        // Support passwords that contain colons by joining remaining parts
        const parsedPassword = parts.slice(4).join(":").trim();

        if (parsedHost && parsedPort && username && parsedPassword) {
          onAddSMTP({ host: parsedHost, port: parsedPort, secure, username, password: parsedPassword });
          addedCount++;
        } else {
          failedLines++;
        }
      } else {
        failedLines++;
      }
    }

    setBulkInput("");
    if (addedCount > 0) {
      setBulkStatus(`U shtuan me sukses ${addedCount} llogari SMTP në Rota.${failedLines > 0 ? ` (${failedLines} rreshta nuk u koduan dot saktë)` : ""}`);
      setTimeout(() => setBulkStatus(null), 5000);
    } else {
      setBulkStatus(`Gabim: Ndarja dështoi. Kontrolloni formatin 'host:port:secure:user:pass'`);
      setTimeout(() => setBulkStatus(null), 5000);
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    await onVerifySMTP(id);
    setTestingId(null);
  };

  return (
    <div id="smtp-manager-section" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-800 flex items-center gap-2">
            🔌 SMTP Rota Connection
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mblidhni llogari të shumta për të shmangur bllokimet dhe për të rrotulluar dërgimet automatikisht.
          </p>
        </div>

        {/* Sandbox toggle badge */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-1.5 flex items-center gap-1 self-start">
          <button
            onClick={() => setSandboxMode(true)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              sandboxMode
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            Dry-Run Sandbox
          </button>
          <button
            onClick={() => setSandboxMode(false)}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              !sandboxMode
                ? "bg-slate-800 text-white shadow-xs"
                : "text-slate-600 hover:text-indigo-600"
            }`}
          >
            Real SMTP Link
          </button>
        </div>
      </div>

      {sandboxMode ? (
        <div className="bg-indigo-50/50 border border-indigo-100/60 rounded-xl p-3 text-xs text-indigo-800 flex items-start gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Regjimi i Simulimit (Sandbox Active)</span>
            Dërgimet dhe analizat e llogarive SMTP janë të simuluara në kohë reale pa dërguar e-mail-e të vërteta. Shto llogari fiktive për të parë sistemin e rrotullimit në veprim.
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Regjimi REAL SMTP Aktiv ✔</span>
            E-mailet po dërgohen realisht tek marrësit tuaj përmes serverit tuaj të shtuar SMTP. Gjithashtu, fusha <strong>FROM / Dërguesi</strong> është e lidhur rreptësisht me përdoruesin e SMTP-së të zgjedhur për dërgimin për të shmangur SPF dështimet.
          </div>
        </div>
      )}

      {/* Rota List */}
      <div className="space-y-3 mb-6">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Ura e Transmetimit ({smtpList.length})
        </h4>

        {smtpList.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-500 text-sm">
            Nuk ka llogari SMTP të shtuara ende. Shtoni një llogari më poshtë për të aktivizuar linjën e rrotullimit.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smtpList.map((smtp) => (
              <div
                key={smtp.id}
                className={`relative border rounded-xl p-4 transition-all flex flex-col justify-between ${
                  smtp.status === SMTPStatus.FAILED
                    ? "border-rose-100 bg-rose-50/30"
                    : smtp.status === SMTPStatus.ACTIVE
                    ? "border-emerald-100 bg-emerald-50/10"
                    : "border-slate-100 bg-slate-50/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-slate-700 truncate max-w-[150px]">
                      {smtp.username}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        smtp.status === SMTPStatus.ACTIVE
                          ? "bg-emerald-100 text-emerald-800"
                          : smtp.status === SMTPStatus.FAILED
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800 animate-pulse"
                      }`}
                    >
                      {smtp.status === SMTPStatus.ACTIVE && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                      {smtp.status === SMTPStatus.FAILED && (
                        <XCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {smtp.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 font-mono mb-1 truncate">
                    {smtp.host}:{smtp.port}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">
                    Metoda {smtp.secure !== "none" ? smtp.secure.toUpperCase() : "Pa Secure"}
                  </p>

                  {smtp.errorMessage && (
                    <div className="mt-2 text-[10px] text-rose-700 font-mono bg-rose-50 p-1.5 rounded border border-rose-100/50 break-words">
                      ⚠️ {smtp.errorMessage}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleTest(smtp.id)}
                    disabled={testingId === smtp.id}
                    className="p-1 px-2.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingId === smtp.id ? "animate-spin text-indigo-600" : ""}`} />
                    Testo lidhjen
                  </button>
                  <button
                    onClick={() => onRemoveSMTP(smtp.id)}
                    className="p-1.5 rounded-lg border border-rose-100 text-rose-600 hover:bg-rose-50 transition-all"
                    title="Largo nga Rota"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form section with tab switcher */}
      <div className="border-t border-slate-100 pt-5 mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h5 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
            Shto Llogari SMTP
          </h5>
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setAddMethod("single")}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                addMethod === "single"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Tek e tek (Single)
            </button>
            <button
              type="button"
              onClick={() => setAddMethod("bulk")}
              className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                addMethod === "bulk"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Me Shumicë (Bulk Paste) ⚡
            </button>
          </div>
        </div>

        {bulkStatus && (
          <div className={`p-3 rounded-xl text-xs mb-4 font-medium border ${
            bulkStatus.startsWith("Gabim")
              ? "bg-rose-50 border-rose-100 text-rose-800"
              : "bg-emerald-50 border-emerald-100 text-emerald-800"
          }`}>
            {bulkStatus}
          </div>
        )}

        {addMethod === "single" ? (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Host / Server SMTP
                </label>
                <input
                  type="text"
                  placeholder="p.sh. smtp.mailgun.org"
                  required
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Porti i SMTP-së
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="587"
                    required
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                    className="w-1/2 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                  />
                  <select
                    value={secure}
                    onChange={(e) => setSecure(e.target.value as "ssl" | "tls" | "none")}
                    className="w-1/2 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50 cursor-pointer"
                  >
                    <option value="tls">StartTLS (587)</option>
                    <option value="ssl">SSL Sec (465)</option>
                    <option value="none">Jo Secure (25)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Përdoruesi / Username
                </label>
                <input
                  type="text"
                  placeholder="postmaster@yourdomain.net"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Fjalëkalimi / Password
                </label>
                <input
                  type="password"
                  placeholder="Fjalëkalimi i SMTP"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Regjistro Llogarinë në Rota
            </button>
          </form>
        ) : (
          <form onSubmit={handleBulkAdd}>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-600 mb-3">
              <span className="font-semibold text-slate-700 block mb-1">Udhëzues rreth Formatit:</span>
              Ngjisni llogaritë një nga një për çdo rresht duke ndjekur rreptësisht këtë kodim:<br />
              <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10.5px] text-indigo-700 block my-1">
                host:port:secure:username:password
              </code>
              Shembull:<br />
              <code className="bg-slate-200/60 px-1 py-0.5 rounded font-mono text-[10.5px] text-slate-700 block my-1 break-all">
                mail.privateemail.com:587:tls:info@mattressdepotusa.space:llAdika123#
              </code>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Lista e SMTP-ve (Një për çdo rresht)
              </label>
              <textarea
                rows={5}
                required
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="mail.privateemail.com:587:tls:përdoruesi@fushata.com:fjalëkalimi1&#10;smtp.gjetër.al:465:ssl:alt@domein.com:pass2"
                className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-600 bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Rregullo & Regjistro Listën Masive
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
