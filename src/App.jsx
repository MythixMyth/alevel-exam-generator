import { useState, useCallback, useEffect } from "react";

const TOPICS_MAP = {
  "Pure Mathematics": [
    "Algebra & Functions",
    "Coordinate Geometry",
    "Sequences & Series",
    "Trigonometry",
    "Exponentials & Logarithms",
    "Differentiation",
    "Integration",
    "Vectors",
    "Numerical Methods",
    "Proof",
  ],
  Statistics: [
    "Data Presentation & Interpretation",
    "Probability",
    "Statistical Distributions",
    "Hypothesis Testing",
  ],
  Mechanics: [
    "Kinematics",
    "Forces & Newton's Laws",
    "Moments",
  ],
};

const DIFFS = [
  { id: "easy", label: "AS Level", marks: "2-4" },
  { id: "medium", label: "A2 Standard", marks: "4-6" },
  { id: "hard", label: "A2 Challenge", marks: "6-10" },
];

const COUNTS = [5, 8, 10, 12, 15];

function gradeFor(pct) {
  if (pct >= 90) return { grade: "A*", color: "#22c55e" };
  if (pct >= 80) return { grade: "A", color: "#22c55e" };
  if (pct >= 70) return { grade: "B", color: "#3b82f6" };
  if (pct >= 60) return { grade: "C", color: "#f59e0b" };
  if (pct >= 50) return { grade: "D", color: "#f97316" };
  if (pct >= 40) return { grade: "E", color: "#ef4444" };
  return { grade: "U", color: "#ef4444" };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildPrompt(topics, difficulties, count) {
  const diffDescs = difficulties.map((d) => {
    if (d === "easy") return "AS-level (2-4 marks each, straightforward single-concept)";
    if (d === "medium") return "A2-standard (4-6 marks each, multi-step requiring two+ techniques)";
    return "A2-challenge (6-10 marks each, synoptic, proof-based, or modelling)";
  });

  return `You are an expert A-Level Mathematics examiner for UK exam boards (Edexcel/AQA/OCR style).

Generate exactly ${count} exam questions for an A-Level Maths practice paper.

TOPICS to cover (distribute questions across these): ${topics.join(", ")}
DIFFICULTY LEVELS to include: ${diffDescs.join("; ")}

For EACH question, respond with a JSON array. Each element must have:
- "topic": the topic name
- "difficulty": "easy", "medium", or "hard"
- "marks": total marks (integer)
- "question": full question text with Unicode maths (x², √, π, θ, ∫, Σ, ≤, ≥, →). Multi-part: (a), (b), (c) with [N marks].
- "markScheme": array of strings, each one mark point with [1 mark] etc.
- "tags": array of 1-3 sub-topic tags

RULES:
- Realistic UK A-Level standard
- Self-contained questions
- Detailed mark schemes for self-assessment
- Vary styles: calculation, "show that", prove, contextual/modelling
- Multi-part questions should build on earlier parts

Respond with ONLY a valid JSON array. No markdown fences, no explanation.`;
}

function pickFromBank(bank, topics, difficulties, count) {
  const matching = bank.filter(
    (q) => topics.includes(q.topic) && difficulties.includes(q.difficulty)
  );
  if (matching.length === 0) return null;

  const shuffled = shuffle(matching);
  const byTopic = {};
  for (const q of shuffled) {
    if (!byTopic[q.topic]) byTopic[q.topic] = [];
    byTopic[q.topic].push(q);
  }

  const selected = [];
  const topicKeys = shuffle(Object.keys(byTopic));
  let idx = 0;
  const limit = Math.min(count, matching.length);

  while (selected.length < limit) {
    const topic = topicKeys[idx % topicKeys.length];
    if (byTopic[topic] && byTopic[topic].length > 0) {
      selected.push(byTopic[topic].pop());
    }
    idx++;
    if (idx > limit * 3) break;
  }

  const order = { easy: 0, medium: 1, hard: 2 };
  selected.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  return selected;
}

const diffColors = {
  easy: { text: "#22c55e", bg: "#0a2e1a" },
  medium: { text: "#f59e0b", bg: "#2d2305" },
  hard: { text: "#ef4444", bg: "#2d1215" },
};

function TopicChip({ name, selected, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: "inline-block",
        padding: "8px 16px",
        borderRadius: 6,
        border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
        background: selected ? "var(--primary-light)" : "var(--bg-alt)",
        color: selected ? "var(--primary)" : "var(--text)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: selected ? 600 : 400,
        fontFamily: "inherit",
        transition: "all 0.15s",
      }}
    >
      {name}
    </button>
  );
}

function Spinner({ message }) {
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(i);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "80px 20px", gap: 16 }}>
      <div style={{
        width: 40, height: 40,
        border: "3px solid var(--border)",
        borderTopColor: "var(--primary)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 14, color: "var(--text-muted)" }}>
        {message}{".".repeat(dots)}
      </div>
    </div>
  );
}

function QuestionCard({ q, index, showMS, selfMark, onMark }) {
  const dc = diffColors[q.difficulty] || diffColors.easy;

  return (
    <div style={{
      background: "var(--bg-card)",
      borderRadius: 8,
      border: "1px solid var(--border)",
      marginBottom: 16,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-alt)",
        flexWrap: "wrap",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Q{index + 1}</span>
          <span style={{
            fontSize: 12,
            padding: "2px 10px",
            borderRadius: 4,
            background: dc.bg,
            color: dc.text,
            fontWeight: 600,
          }}>
            {DIFFS.find((d) => d.id === q.difficulty)?.label || q.difficulty}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{q.topic}</span>
        </div>
        <span style={{
          fontSize: 13,
          color: "var(--text-muted)",
          background: "var(--bg-alt)",
          padding: "2px 8px",
          borderRadius: 4,
        }}>
          {q.marks} marks
        </span>
      </div>

      <div style={{ padding: "16px 20px" }}>
        <div style={{ fontSize: 15, lineHeight: 1.75, whiteSpace: "pre-line" }}>{q.question}</div>
        {q.tags?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            {q.tags.map((t, i) => (
              <span key={i} style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: "var(--bg-alt)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {showMS && (
        <div style={{ borderTop: "2px dashed var(--border)", padding: "16px 20px", background: "var(--bg-alt)" }}>
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            color: "var(--danger)",
            marginBottom: 12,
            textTransform: "uppercase",
          }}>
            Mark Scheme
          </div>
          {(q.markScheme || []).map((step, i) => (
            <div key={i} style={{
              fontSize: 14,
              lineHeight: 1.7,
              padding: "4px 0 4px 14px",
              borderLeft: `3px solid ${dc.text}40`,
              marginBottom: 4,
            }}>
              {step}
            </div>
          ))}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginTop: 14,
            padding: "10px 14px",
            background: "var(--bg-alt)",
            borderRadius: 6,
          }}>
            <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Your marks:</span>
            <input
              type="number"
              min={0}
              max={q.marks}
              value={selfMark ?? ""}
              onChange={(e) =>
                onMark(Math.min(q.marks, Math.max(0, parseInt(e.target.value) || 0)))
              }
              style={{
                width: 50,
                padding: "5px 8px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: 15,
                textAlign: "center",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>/ {q.marks}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("builder");
  const [selTopics, setSelTopics] = useState(new Set());
  const [selDiffs, setSelDiffs] = useState(new Set(["easy", "medium"]));
  const [count, setCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState("");
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showMS, setShowMS] = useState(false);
  const [marks, setMarks] = useState({});
  const [source, setSource] = useState(null);
  const [forceAI, setForceAI] = useState(false);

  const [bank, setBank] = useState([]);
  const [bankLoaded, setBankLoaded] = useState(false);
  const [bankError, setBankError] = useState(false);

  useEffect(() => {
    fetch("/question-bank.json")
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setBank(data);
        setBankLoaded(true);
      })
      .catch(() => {
        setBankError(true);
        setBankLoaded(true);
      });
  }, []);

  const allTopics = Object.values(TOPICS_MAP).flat();

  const toggleTopic = useCallback((id) => {
    setSelTopics((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleDiff = useCallback((id) => {
    setSelDiffs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function generateFromBank() {
    setError(null);
    setShowMS(false);
    setMarks({});

    const picked = pickFromBank(bank, [...selTopics], [...selDiffs], count);
    if (!picked || picked.length === 0) {
      setError("Not enough matching questions for your selection. Try selecting more topics or difficulties.");
      return;
    }

    setQuestions(picked);
    setSource("bank");
    setPage("exam");
  }

  async function generateFromAI() {
    setLoading(true);
    setLoadMsg("Generating questions");
    setError(null);
    setShowMS(false);
    setMarks({});

    const prompt = buildPrompt([...selTopics], [...selDiffs], count);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}. Check your Vercel deployment and API key.`);
      }

      const data = await response.json();
      const text = data.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("No questions returned");
      }

      setQuestions(parsed);
      setSource("ai");
      setPage("exam");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function generate() {
    forceAI ? generateFromAI() : generateFromBank();
  }

  function resetToBuilder() {
    setPage("builder");
    setQuestions([]);
    setShowMS(false);
    setMarks({});
  }

  const totalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalScore = Object.values(marks).reduce((sum, v) => sum + v, 0);
  const pct = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const { grade, color: gradeColor } = gradeFor(pct);

  const matchingCount = bank.filter(
    (q) => selTopics.has(q.topic) && selDiffs.has(q.difficulty)
  ).length;

  const canGenerate = selTopics.size > 0 && selDiffs.size > 0 && (forceAI || bank.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header */}
      <header style={{
        background: "#0b1120",
        color: "#f1f5f9",
        padding: "16px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        borderBottom: "1px solid var(--border)",
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            <span style={{ color: "var(--primary)" }}>A-Level</span> Maths
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 1 }}>Exam Generator</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {bank.length > 0 && (
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              {bank.length} questions in bank
            </span>
          )}
          {page !== "builder" && (
            <button
              onClick={resetToBuilder}
              style={{
                padding: "6px 16px",
                borderRadius: 4,
                border: "1px solid var(--border)",
                background: "var(--primary-light)",
                color: "var(--primary)",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 600,
              }}
            >
              New Paper
            </button>
          )}
        </div>
      </header>

      {/* Builder page */}
      {page === "builder" && !loading && (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 20px" }}>

          {/* Bank status */}
          {bankLoaded && !bankError && bank.length > 0 && (
            <div style={{
              padding: "12px 16px",
              background: "var(--accent-light)",
              borderRadius: 6,
              border: "1px solid #16a34a30",
              marginBottom: 20,
              fontSize: 14,
              color: "var(--accent)",
            }}>
              <strong>Question bank loaded</strong> - {bank.length} questions ready for instant paper generation.
            </div>
          )}

          {bankLoaded && (bankError || bank.length === 0) && (
            <div style={{
              padding: "12px 16px",
              background: "var(--warning-light)",
              borderRadius: 6,
              border: "1px solid #f59e0b30",
              marginBottom: 20,
              fontSize: 14,
              color: "var(--warning)",
            }}>
              <strong>No question bank found.</strong> Place{" "}
              <code style={{ background: "var(--bg-alt)", padding: "1px 4px", borderRadius: 3, fontSize: 13 }}>
                question-bank.json
              </code>{" "}
              in your public folder, or use AI generation mode.
            </div>
          )}

          {/* Topics */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Select Topics</h2>
              <button
                onClick={() =>
                  setSelTopics((prev) =>
                    prev.size === allTopics.length ? new Set() : new Set(allTopics)
                  )
                }
                style={{
                  fontSize: 13,
                  color: "var(--primary)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "inherit",
                }}
              >
                {selTopics.size === allTopics.length ? "Deselect all" : "Select all"}
              </button>
            </div>

            {Object.entries(TOPICS_MAP).map(([category, topics]) => (
              <div key={category} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  color: "var(--text-muted)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}>
                  {category}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {topics.map((t) => (
                    <TopicChip
                      key={t}
                      name={t}
                      selected={selTopics.has(t)}
                      onToggle={() => toggleTopic(t)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>

          {/* Difficulty */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Difficulty</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {DIFFS.map((d) => {
                const on = selDiffs.has(d.id);
                const dc = diffColors[d.id];
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDiff(d.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 6,
                      border: on ? `2px solid ${dc.text}` : "1px solid var(--border)",
                      background: on ? dc.bg : "var(--bg-alt)",
                      cursor: "pointer",
                      textAlign: "left",
                      minWidth: 140,
                      transition: "all 0.15s",
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 600, color: on ? dc.text : "var(--text)" }}>
                      {d.label}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {d.marks} marks
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question count */}
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Number of Questions</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {COUNTS.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 6,
                    border: count === n ? "2px solid var(--primary)" : "1px solid var(--border)",
                    background: count === n ? "var(--primary-light)" : "var(--bg-alt)",
                    color: count === n ? "var(--primary)" : "var(--text)",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            {!forceAI && selTopics.size > 0 && selDiffs.size > 0 && (
              <div style={{
                fontSize: 13,
                color: matchingCount >= count ? "var(--accent)" : "var(--danger)",
                marginTop: 8,
              }}>
                {matchingCount >= count
                  ? `${matchingCount} matching questions available`
                  : matchingCount > 0
                    ? `Only ${matchingCount} matching questions available (requested ${count})`
                    : "No matching questions for this selection"}
              </div>
            )}
          </section>

          {/* Source */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Source</h2>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => setForceAI(false)}
                style={{
                  flex: "1 1 200px",
                  padding: "12px 16px",
                  borderRadius: 6,
                  border: !forceAI ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: !forceAI ? "var(--primary-light)" : "var(--bg-alt)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  opacity: bank.length === 0 ? 0.5 : 1,
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: !forceAI ? "var(--primary)" : "var(--text)" }}>
                  Question Bank
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Instant - no server required
                </div>
              </button>
              <button
                onClick={() => setForceAI(true)}
                style={{
                  flex: "1 1 200px",
                  padding: "12px 16px",
                  borderRadius: 6,
                  border: forceAI ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: forceAI ? "var(--primary-light)" : "var(--bg-alt)",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: forceAI ? "var(--primary)" : "var(--text)" }}>
                  AI Generation
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                  Fresh questions - requires API key
                </div>
              </button>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "var(--danger-light)",
              borderRadius: 6,
              border: "1px solid #ef444430",
              fontSize: 14,
              color: "var(--danger)",
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={!canGenerate}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 6,
              border: "none",
              background: canGenerate ? "var(--primary)" : "var(--border)",
              color: "#ffffff",
              fontSize: 16,
              fontWeight: 600,
              cursor: canGenerate ? "pointer" : "not-allowed",
              transition: "background 0.15s",
              fontFamily: "inherit",
            }}
          >
            {forceAI ? "Generate Paper" : "Build Paper"}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && <Spinner message={loadMsg} />}

      {/* Exam page */}
      {page === "exam" && !loading && (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px" }}>

          {source && (
            <div style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 4,
              marginBottom: 16,
              fontSize: 13,
              background: source === "bank" ? "var(--accent-light)" : "var(--warning-light)",
              color: source === "bank" ? "var(--accent)" : "var(--warning)",
              border: source === "bank" ? "1px solid #22c55e30" : "1px solid #f59e0b30",
            }}>
              {source === "bank" ? "From question bank" : "AI generated"}
            </div>
          )}

          {/* Paper header */}
          <div style={{
            textAlign: "center",
            padding: "24px 20px",
            background: "var(--bg-card)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              A-Level Mathematics
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", letterSpacing: 1, marginBottom: 14, textTransform: "uppercase" }}>
              Practice Paper
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 14, flexWrap: "wrap" }}>
              <span><strong>{questions.length}</strong> Questions</span>
              <span><strong>{totalMarks}</strong> Marks</span>
              <span><strong>{Math.round(totalMarks * 1.2)}</strong> Minutes</span>
            </div>
            <div style={{
              marginTop: 14,
              padding: "10px 14px",
              background: "var(--bg-alt)",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--text-muted)",
            }}>
              Answer <strong>all</strong> questions. Show your working clearly.
            </div>
          </div>

          {questions.map((q, i) => (
            <QuestionCard
              key={q.id || i}
              q={q}
              index={i}
              showMS={showMS}
              selfMark={marks[q.id || i]}
              onMark={(v) => setMarks((prev) => ({ ...prev, [q.id || i]: v }))}
            />
          ))}

          {/* Bottom bar */}
          <div style={{
            position: "sticky",
            bottom: 12,
            padding: "14px 20px",
            background: "rgba(11, 17, 32, 0.95)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            backdropFilter: "blur(8px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.4)",
            marginTop: 12,
            flexWrap: "wrap",
            gap: 12,
          }}>
            {!showMS ? (
              <button
                onClick={() => setShowMS(true)}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 6,
                  border: "none",
                  background: "var(--primary)",
                  color: "#ffffff",
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Reveal Mark Schemes
              </button>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Score
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: gradeColor }}>
                    {totalScore}/{totalMarks}
                    <span style={{
                      fontSize: 13,
                      marginLeft: 8,
                      padding: "2px 8px",
                      background: gradeColor + "18",
                      borderRadius: 4,
                      verticalAlign: "middle",
                      fontWeight: 600,
                    }}>
                      {pct}% - {grade}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={generate}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "2px solid var(--primary)",
                      background: "transparent",
                      color: "var(--primary)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    New Paper
                  </button>
                  <button
                    onClick={resetToBuilder}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                      background: "transparent",
                      color: "var(--text)",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                    }}
                  >
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
