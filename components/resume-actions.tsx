"use client";

import { Button } from "@/components/ui/button";
import { i18n } from "@/lib/i18n";
import { Download } from "lucide-react";

export function ResumeActions() {
  return (
    <div className="flex w-full flex-wrap gap-3 min-[420px]:w-auto print:hidden">
      <Button
        onClick={() => window.print()}
        variant="secondary"
        size="sm"
        className="h-10 w-full rounded-md min-[420px]:w-auto"
      >
        <Download size={16} />
        {i18n.resume.downloadPdf}
      </Button>
    </div>
  );
}
