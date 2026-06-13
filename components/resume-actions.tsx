"use client";

import { Button } from "@/components/ui/button";
import { i18n } from "@/lib/i18n";
import { Download } from "lucide-react";

export function ResumeActions() {
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      <Button
        onClick={() => window.print()}
        variant="secondary"
        size="sm"
        className="rounded-full"
      >
        <Download size={16} />
        {i18n.resume.downloadPdf}
      </Button>
    </div>
  );
}
