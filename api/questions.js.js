import fs from "fs";
import path from "path";

let questionBank = [];
try {
  const bankPath = path.join(process.cwd(), "public", "question-bank.json");
  questionBank = JSON.parse(fs.readFileSync(bankPath, "utf-8"));
} catch {
  console.warn("No question-bank.json found, all requests will use AI generation");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function serveFromBank(topics, difficulties, count) {
  const matching = questionBank.filter(
    (q) => topics.includes(q.topic) && difficulties.includes(q.difficulty)
  );
  if (matching.length < count) return null;

  const byTopic = {};
  for (const q of shuffle(matching)) {
    if (!byTopic[q.topic]) byTopic[q.topic] = [];
    byTopic[q.topic].push(q);
  }

  const selected = [];
  const topicKeys = shuffle(Object.keys(byTopic));
  let idx = 0;

  while (selected.length < count) {
    const topic = topicKeys[idx % topicKeys.length];
    if (byTopic[topic].length > 0) {
      selected.push(byTopic[topic].pop());
    }
    idx++;
    if (idx > count * 2) break;
  }

  const order = { easy: 0, medium: 1, hard: 2 };
  selected.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  return selected;
}

async function generateLive(topics, difficulties, count) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const diffDescs = difficulties.map((d) => {
    if (d === "easy") return "AS-level (2-4 marks each)";
    if (d === "medium") return "A2-standard (4-6 marks each)";
    return "A2-challenge (6-10 marks each)";
  });

  const prompt = `You are an expert A-Level Mathematics examiner for UK exam boards (Edexcel/AQA/OCR).
Generate exactly ${count} exam questions.
TOPICS: ${topics.join(", ")}
DIFFICULTIES: ${diffDescs.join("; ")}

For EACH question return JSON with: topic, difficulty, marks (int), question (Unicode maths), markScheme (array of mark-point strings), tags (array of sub-topic strings).
Respond with ONLY a valid JSON array.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const { topics, difficulties, count, forceAI } = req.body;

  if (!topics?.length || !difficulties?.length || !count) {
    return res.status(400).json({ error: "Missing topics, difficulties, or count" });
  }

  try {
    if (!forceAI) {
      const cached = serveFromBank(topics, difficulties, count);
      if (cached) {
        return res.status(200).json({
          source: "bank",
          bankSize: questionBank.length,
          questions: cached,
        });
      }
    }

    const questions = await generateLive(topics, difficulties, count);
    return res.status(200).json({ source: "ai", questions });
  } catch (err) {
    console.error("Generation error:", err);
    return res.status(500).json({ error: err.message });
  }
}
