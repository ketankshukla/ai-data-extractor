"use client";

import { useState } from "react";
import type { ExtractionResult } from "@/lib/extract";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleExtract() {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error ?? "Extraction failed.");
      }

      setResult(data as ExtractionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-8 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            AI Structured-Data Extractor
          </h1>
          <p className="text-lg leading-7 text-zinc-600 dark:text-zinc-400">
            Paste an invoice, receipt, or email below. Claude will read it and
            return clean, structured JSON — shown both as a formatted summary
            and as raw JSON.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          <label
            htmlFor="input-text"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Paste an invoice, receipt, or email
          </label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your messy text here..."
            rows={12}
            className="w-full rounded-lg border border-zinc-300 bg-white p-4 text-sm text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <button
            onClick={handleExtract}
            disabled={loading || !inputText.trim()}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-[#ccc] sm:w-40"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Extracting...
              </>
            ) : (
              "Extract"
            )}
          </button>
        </section>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {result && (
          <section className="flex flex-col gap-4">
            <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Extracted result
              </h2>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Document type" value={result.documentType} />
                <Field label="Vendor" value={result.vendor} />
                <Field label="Date" value={result.date} />
                <Field label="Currency" value={result.currency} />
                <Field label="Subtotal" value={result.subtotal} />
                <Field label="Tax" value={result.tax} />
                <Field label="Total" value={result.total} />
              </dl>

              {result.notes && (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">Notes: </span>
                  {result.notes}
                </p>
              )}

              {result.lineItems.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                        <th className="py-2 pr-4">Description</th>
                        <th className="py-2 pr-4">Qty</th>
                        <th className="py-2 pr-4">Unit price</th>
                        <th className="py-2 pr-4">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.lineItems.map((item, i) => (
                        <tr
                          key={i}
                          className="border-b border-zinc-100 text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                        >
                          <td className="py-2 pr-4">
                            {item.description ?? "—"}
                          </td>
                          <td className="py-2 pr-4">{item.quantity ?? "—"}</td>
                          <td className="py-2 pr-4">
                            {item.unitPrice ?? "—"}
                          </td>
                          <td className="py-2 pr-4">{item.amount ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <details
              open={showRaw}
              onToggle={(e) => setShowRaw(e.currentTarget.open)}
              className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Raw JSON
              </summary>
              <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-100">
        {value ?? "—"}
      </dd>
    </div>
  );
}
