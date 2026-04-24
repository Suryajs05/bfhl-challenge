"use client";
import { useState, useRef } from "react";

// ── Helpers ───────────────────────────────────────────────────────────────────
function TreeNode({ label, children }) {
  const [open, setOpen] = useState(true);
  const hasChildren = children && Object.keys(children).length > 0;
  return (
    <div className="ml-4 font-mono text-sm">
      <div
        className={`flex items-center gap-1 select-none ${hasChildren ? "cursor-pointer" : ""}`}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        <span className="text-amber-400 text-xs w-3">
          {hasChildren ? (open ? "▾" : "▸") : "·"}
        </span>
        <span className="text-emerald-300">{label}</span>
      </div>
      {open && hasChildren && (
        <div className="border-l border-zinc-700 ml-1 pl-2 mt-0.5">
          {Object.entries(children).map(([k, v]) => (
            <TreeNode key={k} label={k} children={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function renderNestedTree(tree) {
  if (!tree || Object.keys(tree).length === 0) return null;
  return Object.entries(tree).map(([root, children]) => (
    <TreeNode key={root} label={root} children={children} />
  ));
}

function HierarchyCard({ h, index }) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all duration-300 ${
        h.has_cycle
          ? "border-red-700/60 bg-red-950/20"
          : "border-emerald-800/50 bg-emerald-950/20"
      }`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded-full font-mono ${
            h.has_cycle
              ? "bg-red-900/60 text-red-300 border border-red-700"
              : "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
          }`}
        >
          {h.has_cycle ? "⟳ CYCLE" : "🌲 TREE"}
        </span>
        <span className="text-zinc-200 font-semibold font-mono text-base">
          Root:{" "}
          <span className={h.has_cycle ? "text-red-400" : "text-amber-300"}>
            {h.root}
          </span>
        </span>
        {h.depth !== undefined && (
          <span className="ml-auto text-xs text-zinc-500 font-mono">
            depth{" "}
            <span className="text-sky-400 font-bold">{h.depth}</span>
          </span>
        )}
      </div>

      {/* Tree visualisation */}
      {h.has_cycle ? (
        <p className="text-xs text-red-400/70 italic font-mono">
          Cyclic group — no tree representation
        </p>
      ) : (
        <div className="bg-zinc-900/60 rounded-lg p-3 border border-zinc-800">
          {renderNestedTree(h.tree)}
        </div>
      )}
    </div>
  );
}

function Badge({ children, color = "zinc" }) {
  const colors = {
    zinc: "bg-zinc-800 text-zinc-300 border-zinc-700",
    red: "bg-red-900/40 text-red-300 border-red-700/50",
    amber: "bg-amber-900/40 text-amber-300 border-amber-700/50",
    sky: "bg-sky-900/40 text-sky-300 border-sky-700/50",
  };
  return (
    <span
      className={`inline-flex items-center font-mono text-xs px-2 py-0.5 rounded border ${colors[color]}`}
    >
      {children}
    </span>
  );
}

const DEFAULT_EXAMPLE = JSON.stringify(
  {
    data: [
      "A->B", "A->C", "B->D", "C->E", "E->F",
      "X->Y", "Y->Z", "Z->X",
      "P->Q", "Q->R",
      "G->H", "G->H", "G->I",
      "hello", "1->2", "A->",
    ],
  },
  null,
  2
);

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState(DEFAULT_EXAMPLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  async function handleSubmit() {
    setError("");
    setResult(null);
    setLoading(true);

    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch {
      setError("⚠ Invalid JSON — please check your input and try again.");
      setLoading(false);
      return;
    }

    if (!parsed.data || !Array.isArray(parsed.data)) {
      setError('⚠ JSON must contain a "data" array.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "API error");
      setResult(json);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(`⚠ API call failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setInput(DEFAULT_EXAMPLE);
    setResult(null);
    setError("");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      {/* Google Fonts */}

      {/* ── Top bar ── */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-emerald-400 text-lg">◈</span>
          <span className="font-bold text-zinc-100 text-sm tracking-tight" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            BFHL Graph Processor
          </span>
          <span className="text-zinc-600 text-xs ml-1">/ SRM Full Stack Challenge — Round 1</span>
          <span className="ml-auto text-xs text-zinc-600 font-mono">POST /api/bfhl</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* ── Hero ── */}
        <div className="fade-up space-y-1">
          <h1 className="text-3xl font-bold text-zinc-50" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            Hierarchy Analyzer
          </h1>
          <p className="text-zinc-500 text-sm">
            Paste a JSON payload with a <Badge color="sky">data</Badge> array of node edges and explore the computed tree structure.
          </p>
        </div>

        {/* ── Input Panel ── */}
        <div className="fade-up bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden" style={{ animationDelay: "80ms" }}>
          {/* Tab bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
            </div>
            <span className="text-zinc-600 text-xs ml-2">input.json</span>
          </div>
          <textarea
            className="textarea-glow w-full bg-transparent text-emerald-300 placeholder-zinc-700 px-5 py-4 text-sm font-mono outline-none resize-none border border-transparent rounded-none focus:border-emerald-600/40 transition-colors"
            style={{ minHeight: "200px" }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            placeholder={'{\n  "data": ["A->B", "B->C"]\n}'}
          />
          {/* Actions */}
          <div className="flex items-center gap-3 px-4 py-3 border-t border-zinc-800 bg-zinc-900/60">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-700 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
              style={{ fontFamily: "Space Grotesk, sans-serif" }}
            >
              {loading ? (
                <>
                  <svg className="spinner w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                  </svg>
                  Processing…
                </>
              ) : (
                <>▶ Submit</>
              )}
            </button>
            <button
              onClick={handleReset}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-2 py-1"
            >
              Reset Example
            </button>
            <span className="ml-auto text-xs text-zinc-700">
              Content-Type: application/json
            </span>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="fade-up bg-red-950/40 border border-red-700/50 rounded-xl px-5 py-4 text-red-300 text-sm font-mono">
            {error}
          </div>
        )}

        {/* ── Result ── */}
        {result && (
          <div ref={resultRef} className="space-y-6 fade-up" style={{ animationDelay: "0ms" }}>

            {/* Identity Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Identity
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                {[
                  ["user_id", result.user_id],
                  ["email_id", result.email_id],
                  ["roll_number", result.college_roll_number],
                ].map(([k, v]) => (
                  <div key={k} className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
                    <div className="text-zinc-600 text-xs mb-1">{k}</div>
                    <div className="text-amber-300 font-mono text-xs break-all">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Summary
              </h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["Total Trees", result.summary.total_trees, "text-emerald-400"],
                  ["Total Cycles", result.summary.total_cycles, "text-red-400"],
                  ["Largest Root", result.summary.largest_tree_root || "—", "text-amber-400"],
                ].map(([label, val, color]) => (
                  <div key={label} className="bg-zinc-950 rounded-xl p-4 border border-zinc-800">
                    <div className={`text-2xl font-bold font-mono ${color}`}>{val}</div>
                    <div className="text-zinc-600 text-xs mt-1" style={{ fontFamily: "Space Grotesk, sans-serif" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hierarchies */}
            <div className="space-y-3">
              <h2 className="text-xs uppercase tracking-widest text-zinc-500" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                Hierarchies ({result.hierarchies.length})
              </h2>
              {result.hierarchies.map((h, i) => (
                <HierarchyCard key={h.root + i} h={h} index={i} />
              ))}
            </div>

            {/* Invalid + Duplicates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Invalid Entries", items: result.invalid_entries, color: "red" },
                { label: "Duplicate Edges", items: result.duplicate_edges, color: "amber" },
              ].map(({ label, items, color }) => (
                <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h2 className="text-xs uppercase tracking-widest text-zinc-500" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
                    {label}{" "}
                    <Badge color={color}>{items.length}</Badge>
                  </h2>
                  {items.length === 0 ? (
                    <p className="text-zinc-700 text-xs italic font-mono">none</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {items.map((entry, i) => (
                        <Badge key={i} color={color}>{entry}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Raw JSON */}
            <details className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden group">
              <summary className="px-5 py-3 text-xs text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none flex items-center gap-2">
                <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                Raw JSON Response
              </summary>
              <pre className="px-5 pb-5 text-xs text-zinc-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>

          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 mt-16 py-6 text-center text-zinc-700 text-xs font-mono">
        BFHL Graph API · SRM Institute of Science and Technology · RA2311047010119
      </footer>
    </div>
  );
}