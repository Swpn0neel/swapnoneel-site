"use client";

import { i18n } from "@/lib/i18n";
import { Download } from "lucide-react";

export function ResumeActions() {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <button 
        onClick={() => window.print()}
        className="bg-secondary hover:bg-secondary/80 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
      >
        <Download size={16} />
        {i18n.resume.downloadPdf}
      </button>
    </div>
  );
}
