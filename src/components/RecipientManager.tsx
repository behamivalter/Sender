import React, { useState, useMemo } from "react";
import { Users, Upload, AlignLeft, AlertCircle } from "lucide-react";

interface RecipientManagerProps {
  emailInput: string;
  onChangeEmails: (value: string) => void;
}

export default function RecipientManager({ emailInput, onChangeEmails }: RecipientManagerProps) {
  const [dragActive, setDragActive] = useState(false);

  // Parse lines to find valid email occurrences
  const emails = useMemo(() => {
    return emailInput
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0 && e.includes("@"));
  }, [emailInput]);

  // Dynamically analyze domain distribution for modern visual metric presentation
  const domainDistribution = useMemo(() => {
    if (emails.length === 0) return [];
    
    const freq: Record<string, number> = {};
    emails.forEach((email) => {
      const parts = email.split("@");
      if (parts.length > 1) {
        let domain = parts[1].toLowerCase();
        // Categorize common providers
        if (domain.includes("gmail")) domain = "gmail.com";
        else if (domain.includes("yahoo")) domain = "yahoo.com";
        else if (domain.includes("hotmail") || domain.includes("outlook") || domain.includes("live")) domain = "outlook.com";
        else domain = "company / enterprise";

        freq[domain] = (freq[domain] || 0) + 1;
      }
    });

    return Object.entries(freq)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / emails.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [emails]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onChangeEmails(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        onChangeEmails(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
      <div className="border-b border-slate-100 pb-4 mb-4">
        <h3 className="font-display text-lg font-semibold text-slate-800 flex items-center gap-2">
          👥 Lista e Marrësve (Recipients)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Shtoni ose tërhiqni një listë e-mailesh (e ndarë me rresht të ri ose presje).
        </p>
      </div>

      {/* Drag & Drop Input / Clipboard */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-4 transition-all ${
          dragActive
            ? "border-indigo-600 bg-indigo-50/20"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <textarea
          value={emailInput}
          onChange={(e) => onChangeEmails(e.target.value)}
          rows={7}
          placeholder="user1@gmail.com&#10;user2@company.al&#10;user3@outlook.com"
          className="w-full text-xs font-mono p-1 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none"
        />

        <div className="absolute right-4 bottom-4 flex items-center gap-3">
          <label className="cursor-pointer bg-slate-50 border border-slate-200 hover:bg-slate-100 p-1.5 px-3 rounded-lg text-[10px] text-slate-600 font-semibold flex items-center gap-1.5 transition-all">
            <Upload className="w-3.5 h-3.5" />
            Ngarko .txt / .csv
            <input
              type="file"
              accept=".txt,.csv"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {emails.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-500" />
              Marrës të vlefshëm: <span className="text-indigo-600 font-bold">{emails.length}</span>
            </span>
            <button
              onClick={() => onChangeEmails("")}
              className="text-[10px] uppercase tracking-wider text-rose-600 hover:text-rose-700 font-bold transition-all"
            >
              Pastro Listën
            </button>
          </div>

          {/* Domain Breakdown Chart Card */}
          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Struktura e Domenave (Domain Breakdown)
            </h4>

            <div className="space-y-2">
              {domainDistribution.map((domain) => (
                <div key={domain.name}>
                  <div className="flex justify-between text-[11px] text-slate-600 font-mono mb-1">
                    <span>{domain.name}</span>
                    <span className="font-semibold text-slate-700">{domain.count} ({domain.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        domain.name === "gmail.com"
                          ? "bg-rose-500"
                          : domain.name === "outlook.com"
                          ? "bg-sky-500"
                          : domain.name === "yahoo.com"
                          ? "bg-purple-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${domain.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {emails.length === 0 && (
        <div className="mt-3 flex items-start gap-1.5 p-2 px-3 bg-slate-50/80 rounded-lg text-[10px] text-slate-500">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          Mos harroni: Pas dërgimit, rreshti i parë do dërgohet dhe do zhvendoset nga lista kur përfundon me sukses (SMTP-ja do rrotullohet automatikisht në rast bllokimi).
        </div>
      )}
    </div>
  );
}
