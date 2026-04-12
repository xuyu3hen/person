"use client";

import React, { useEffect, useState } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-markdown";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "typescript", className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setMounted(true);
    Prism.highlightAll();
  }, [code, language]);

  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl border border-[color:var(--border)] bg-[#0d0d0d] overflow-hidden text-sm",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2e2e2e]/50 bg-[#171717]">
        <span className="text-xs text-[#a6a6a6] font-mono lowercase">{language}</span>
        <button
          onClick={onCopy}
          className="text-[#a6a6a6] hover:text-white transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        {mounted ? (
          <pre className={cn(`language-${language}`, "m-0 p-0 bg-transparent text-[#ececec] font-mono text-[13px] leading-relaxed")}>
            <code className={`language-${language}`}>{code}</code>
          </pre>
        ) : (
          <pre className="m-0 p-0 bg-transparent text-[#ececec] font-mono text-[13px] leading-relaxed">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
