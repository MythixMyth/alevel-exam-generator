import { useState, useCallback, useEffect } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────
const TOPICS_MAP = {
  "Pure Mathematics": [
    { id: "Algebra & Functions", icon: "ƒ" },
    { id: "Coordinate Geometry", icon: "◎" },
    { id: "Sequences & Series", icon: "Σ" },
    { id: "Trigonometry", icon: "θ" },
    { id: "Exponentials & Logarithms", icon: "eˣ" },
    { id: "Differentiation", icon: "∂" },
    { id: "Integration", icon: "∫" },
    { id: "Vectors", icon: "→" },
    { id: "Numerical Methods", icon: "≈" },
    { id: "Proof", icon: "∴" },
  ],
  Statistics: [
    { id: "Data Presentation & Interpretation", icon: "📊" },
    { id: "Probability", icon: "⅟" },
    { id: "Statistical Distributions", icon: "φ" },
    { id: "Hypothesis Testing", icon: "H₀" },
  ],
  Mechanics: [
    { id: "Kinematics", icon: "⟿" },
    { id: "Forces & Newton's Laws", icon: "N" },
    { id: "Moments", icon: "⤾" },
  ],
};

const DIFFS = [
  { id: "easy", label: "AS Level", marks: "2–4", color: "#3d8b37", bg: "#edf7ec" },
  { id: "medium", label: "A2 Standard", marks: "4–6", color: "#c6922a", bg: "#fdf5e6" },
  { id: "hard", label: "A2 Challenge", marks: "6–10", color: "#c44b3f", bg: "#fdf0ee" },
];

const COUNTS = [5, 8, 10, 12, 15];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const gradeFor = (pct) => {
  if (pct >= 90) return { g: "A*", c: "#3d8b37" };
  if (pct >= 80) return { g: "A", c: "#3d8b37" };
  if (pct >= 70) return { g: "B", c: "#457b9d" };
  if (pct >= 60) return { g: "C", c: "#c6922a" };
  if (pct >= 50) return { g: "D", c: "#e07a3a" };
  if (pct >= 40) return { g: "E", c: "#c44b3f" };
  return { g: "U", c: "#c44b3f" };
};

// ─── Components ──────────────────────────────────────────────────────────────

function TopicChip({ topic, selected, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "10px 18px", borderRadius: 8,
      border: selected ? "2px solid var(--teal)" : "2px solid var(--rule)",
      background: selected ? "var(--tealBg)" : "var(--card)",
      color: selected ? "var(--teal)" : "var(--ink)",
      cursor: "pointer", fontFamily: "'Literata', serif", fontSize: 14,
      fontWeight: selected ? 600 : 400, transition: "all 0.2s", whiteSpace: "nowrap",
    }}>
      <span style={{ fontSize: 16, opacity: 0.7 }}>{topic.icon}</span>
      {topic.id}
    </button>
  );
}

function Spinner({ message }) {
  const [dots, setDots] = useState(0);
  useEffect(() => { const i = setInterval(() => setDots(d => (d + 1) % 4), 400); return () => clearInterval(i); }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 20 }}>
      <div style={{ width: 48, height: 48, border: "4px solid var(--rule)", borderTopColor: "var(--teal)", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--ghost)" }}>
        {message}{".".repeat(dots)}
      </div>
    </div>
  );
}

function QuestionCard({ q, index, showMS, selfMark, onMark }) {
  const d = DIFFS.find(x => x.id === q.difficulty) || DIFFS[0];
  return (
    <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--rule)", marginBottom: 20, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 24px", borderBottom: "1px solid var(--rule)", background: "#fafaf7" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700 }}>Q{index + 1}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: "3px 10px", borderRadius: 4, background: d.bg, color: d.color, fontWeight: 600 }}>{d.label}</span>
          <span style={{ fontFamily: "'Literata', serif", fontSize: 13, color: "var(--ghost)" }}>{q.topic}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ghost)", background: "var(--paper)", padding: "4px 10px", borderRadius: 4 }}>{q.marks} marks</span>
      </div>
      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ fontFamily: "'Literata', serif", fontSize: 15.5, lineHeight: 1.8, whiteSpace: "pre-line" }}>{q.question}</div>
        {q.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 12 }}>
            {q.tags.map((t, i) => (
              <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--paper)", color: "var(--ghost)", border: "1px solid var(--rule)" }}>{t}</span>
            ))}
          </div>
        )}
      </div>
      {/* Mark scheme */}
      {showMS && (
        <div style={{ borderTop: "2px dashed var(--rule)", padding: "20px 24px", background: "#fdfcf8" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "var(--red)", marginBottom: 14, textTransform: "uppercase" }}>Mark Scheme</div>
          {(q.markScheme || []).map((step, i) => (
            <div key={i} style={{ fontFamily: "'Literata', serif", fontSize: 14, lineHeight: 1.7, padding: "5px 0 5px 16px", borderLeft: `3px solid ${d.color}40`, marginBottom: 6 }}>{step}</div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, padding: "12px 16px", background: "var(--paper)", borderRadius: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ghost)" }}>YOUR MARKS:</span>
            <input type="number" min={0} max={q.marks} value={selfMark ?? ""} onChange={e => onMark(Math.min(q.marks, Math.max(0, parseInt(e.target.value) || 0)))}
              style={{ width: 52, padding: "6px 8px", borderRadius: 6, border: "2px solid var(--rule)", background: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 15, textAlign: "center", outline: "none", color: "var(--ink)" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: "var(--ghost)" }}>/ {q.marks}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("builder");
  const [selTopics, setSelTopics] = useState(new Set());
  const [selDiffs, setSelDiffs] = useState(new Set(["easy", "medium"]));
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("Preparing your exam paper");
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showMS, setShowMS] = useState(false);
  const [marks, setMarks] = useState({});
  const [source, setSource] = useState(null); // "bank" or "ai"
  const [bankSize, setBankSize] = useState(null);
  const [forceAI, setForceAI] = useState(false);

  const allIds = Object.values(TOPICS_MAP).flat().map(t => t.id);

  const toggleTopic = useCallback((id) => {
    setSelTopics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleDiff = useCallback((id) => {
    setSelDiffs(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setShowMS(false);
    setMarks({});
    setSource(null);
    setBankSize(null);

    setLoadMsg(forceAI ? "Generating fresh questions with AI" : "Searching the question bank");

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: [...selTopics],
          difficulties: [...selDiffs],
          count,
          forceAI,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      if (!data.questions?.length) throw new Error("No questions returned");

      setQuestions(data.questions);
      setSource(data.source);
      setBankSize(data.bankSize || null);
      setPage("exam");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalM = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const totalS = Object.values(marks).reduce((s, v) => s + v, 0);
  const pct = totalM > 0 ? Math.round((totalS / totalM) * 100) : 0;
  const { g: grade, c: gradeColor } = gradeFor(pct);

  return (
    <div style={{
      "--ink": "#1b1b2f", "--paper": "#f7f5f0", "--card": "#fff", "--ghost": "#9a9aad",
      "--rule": "#e2dfd8", "--teal": "#1a7a6d", "--tealBg": "#e8f5f2", "--red": "#c44b3f",
      minHeight: "100vh", background: "var(--paper)", color: "var(--ink)",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,300;7..72,400;7..72,500;7..72,600;7..72,700;7..72,800&family=JetBrains+Mono:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,700;9..144,800;9..144,900&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "#1b1b2f", color: "#fff", padding: "20px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900 }}>A-Level Maths</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, opacity: 0.5, letterSpacing: 2, marginTop: 2 }}>EXAM GENERATOR · CACHED + AI</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {bankSize != null && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, opacity: 0.5 }}>
              📦 {bankSize} questions in bank
            </span>
          )}
          {page !== "builder" && (
            <button onClick={() => { setPage("builder"); setQuestions([]); setShowMS(false); setMarks({}); }}
              style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: "pointer" }}>
              ← New Paper
            </button>
          )}
        </div>
      </div>

      {/* ─── BUILDER ─── */}
      {page === "builder" && !loading && (
        <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 20px" }}>

          {/* Info */}
          <div style={{ padding: "14px 18px", background: "var(--tealBg)", borderRadius: 10, border: "1px solid #c5e4dd", marginBottom: 28, display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div style={{ fontFamily: "'Literata', serif", fontSize: 13.5, lineHeight: 1.6, color: "var(--teal)" }}>
              <strong>Smart Caching</strong> — Questions are served instantly from your pre-generated bank. Toggle "Force AI" to generate fresh questions on demand (uses API credits).
            </div>
          </div>

          {/* Topics */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: "var(--teal)", fontWeight: 700, marginBottom: 3 }}>01</div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 800 }}>Select Topics</div>
              </div>
              <button onClick={() => setSelTopics(p => p.size === allIds.length ? new Set() : new Set(allIds))}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--teal)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                {selTopics.size === allIds.length ? "Deselect all" : "Select all"}
              </button>
            </div>
            {Object.entries(TOPICS_MAP).map(([cat, topics]) => (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 1.5, color: "var(--ghost)", marginBottom: 8, textTransform: "uppercase" }}>{cat}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topics.map(t => <TopicChip key={t.id} topic={t} selected={selTopics.has(t.id)} onToggle={() => toggleTopic(t.id)} />)}
                </div>
              </div>
            ))}
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: "var(--teal)", fontWeight: 700, marginBottom: 3 }}>02</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 800, marginBottom: 12 }}>Difficulty</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {DIFFS.map(d => {
                const on = selDiffs.has(d.id);
                return (
                  <button key={d.id} onClick={() => toggleDiff(d.id)}
                    style={{ padding: "12px 20px", borderRadius: 10, border: on ? `2px solid ${d.color}` : "2px solid var(--rule)", background: on ? d.bg : "var(--card)", cursor: "pointer", textAlign: "left", minWidth: 160, transition: "all 0.2s" }}>
                    <div style={{ fontFamily: "'Literata', serif", fontSize: 14, fontWeight: 600, color: on ? d.color : "var(--ink)" }}>{d.label}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ghost)" }}>{d.marks} marks</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Count */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: "var(--teal)", fontWeight: 700, marginBottom: 3 }}>03</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 800, marginBottom: 12 }}>Questions</div>
            <div style={{ display: "flex", gap: 10 }}>
              {COUNTS.map(n => (
                <button key={n} onClick={() => setCount(n)}
                  style={{ width: 52, height: 52, borderRadius: 10, border: count === n ? "2px solid var(--teal)" : "2px solid var(--rule)", background: count === n ? "var(--tealBg)" : "var(--card)", color: count === n ? "var(--teal)" : "var(--ink)", fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Source toggle */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2, color: "var(--teal)", fontWeight: 700, marginBottom: 3 }}>04</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 19, fontWeight: 800, marginBottom: 12 }}>Source</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[
                { val: false, label: "Question Bank", desc: "Instant · Free", icon: "📦" },
                { val: true, label: "Fresh AI Generation", desc: "~20s · Uses credits", icon: "🤖" },
              ].map(opt => (
                <button key={String(opt.val)} onClick={() => setForceAI(opt.val)}
                  style={{ flex: 1, padding: "14px 18px", borderRadius: 10, border: forceAI === opt.val ? "2px solid var(--teal)" : "2px solid var(--rule)", background: forceAI === opt.val ? "var(--tealBg)" : "var(--card)", cursor: "pointer", textAlign: "left", transition: "all 0.2s" }}>
                  <div style={{ fontFamily: "'Literata', serif", fontSize: 14, fontWeight: 600, color: forceAI === opt.val ? "var(--teal)" : "var(--ink)" }}>{opt.icon} {opt.label}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ghost)", marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "14px 18px", background: "#fdf0ee", borderRadius: 8, border: "1px solid #f0c4c0", fontFamily: "'Literata', serif", fontSize: 14, color: "var(--red)", marginBottom: 18 }}>
              ⚠ {error}
            </div>
          )}

          {/* Generate */}
          <button onClick={generate} disabled={selTopics.size === 0 || selDiffs.size === 0}
            style={{
              width: "100%", padding: "18px", borderRadius: 12, border: "none",
              background: (selTopics.size === 0 || selDiffs.size === 0) ? "var(--rule)" : "linear-gradient(135deg, #1b1b2f, #1a7a6d)",
              color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800,
              cursor: (selTopics.size === 0 || selDiffs.size === 0) ? "not-allowed" : "pointer",
              boxShadow: selTopics.size > 0 ? "0 6px 28px rgba(26,122,109,0.3)" : "none",
              transition: "all 0.3s",
            }}>
            {forceAI ? "Generate Fresh Paper" : "Build Paper from Bank"}
          </button>
        </div>
      )}

      {/* ─── LOADING ─── */}
      {loading && <Spinner message={loadMsg} />}

      {/* ─── EXAM ─── */}
      {page === "exam" && !loading && (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "28px 20px" }}>

          {/* Source badge */}
          {source && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 14px", borderRadius: 6, marginBottom: 16,
              background: source === "bank" ? "var(--tealBg)" : "#fdf5e6",
              border: source === "bank" ? "1px solid #c5e4dd" : "1px solid #f0deb8",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: source === "bank" ? "var(--teal)" : "#c6922a",
            }}>
              {source === "bank" ? "📦 Served from bank — no API credits used" : "🤖 Freshly generated by AI"}
            </div>
          )}

          {/* Paper header */}
          <div style={{ textAlign: "center", padding: "28px 24px", background: "var(--card)", borderRadius: 14, border: "1px solid var(--rule)", marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, marginBottom: 4 }}>A-Level Mathematics</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--ghost)", letterSpacing: 1.5, marginBottom: 16 }}>PRACTICE EXAMINATION PAPER</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              <span><strong>{questions.length}</strong> Questions</span>
              <span><strong>{totalM}</strong> Marks</span>
              <span><strong>{Math.round(totalM * 1.2)}</strong> Min</span>
            </div>
            <div style={{ marginTop: 16, padding: "10px 14px", background: "var(--paper)", borderRadius: 8, fontFamily: "'Literata', serif", fontSize: 13.5, color: "var(--ghost)", lineHeight: 1.5 }}>
              Answer <strong>all</strong> questions. Show working. Click "Reveal Mark Schemes" when done.
            </div>
          </div>

          {/* Questions */}
          {questions.map((q, i) => (
            <QuestionCard key={q.id || i} q={q} index={i} showMS={showMS}
              selfMark={marks[q.id || i]}
              onMark={(v) => setMarks(p => ({ ...p, [q.id || i]: v }))} />
          ))}

          {/* Bottom bar */}
          <div style={{ position: "sticky", bottom: 12, padding: "14px 20px", background: "#ffffffee", borderRadius: 14, border: "1px solid var(--rule)", backdropFilter: "blur(12px)", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -2px 16px rgba(0,0,0,0.06)", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
            {!showMS ? (
              <button onClick={() => setShowMS(true)}
                style={{ flex: 1, padding: "14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #c44b3f, #e07a3a)", color: "#fff", fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 16px rgba(196,75,63,0.3)" }}>
                Reveal Mark Schemes & Self-Assess
              </button>
            ) : (
              <>
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--ghost)", letterSpacing: 1.5, marginBottom: 3, textTransform: "uppercase" }}>Score</div>
                  <div style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 900, color: gradeColor }}>
                    {totalS}/{totalM}
                    <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", marginLeft: 10, padding: "3px 10px", background: gradeColor + "15", borderRadius: 5, verticalAlign: "middle", fontWeight: 600 }}>
                      {pct}% · {grade}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={generate}
                    style={{ padding: "10px 20px", borderRadius: 8, border: "2px solid var(--teal)", background: "transparent", color: "var(--teal)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    New Paper
                  </button>
                  <button onClick={() => { setPage("builder"); setQuestions([]); setShowMS(false); setMarks({}); }}
                    style={{ padding: "10px 20px", borderRadius: 8, border: "2px solid var(--rule)", background: "transparent", color: "var(--ink)", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Change Topics
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
