"use client";

import { useCallback, useEffect, useState } from "react";

export function useCopyToClipboard() {
  const [lastCopied, setLastCopied] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setLastCopied(text);
    setCopied(true);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return { copy, lastCopied, copied };
}

