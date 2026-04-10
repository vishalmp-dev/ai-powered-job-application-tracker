import { GoogleGenAI } from "@google/genai";

// MULTI API KEY SETUP
const apiKeys = [
  process.env.GEMINI_API_KEY_1!,
  process.env.GEMINI_API_KEY_2!,
];

let currentKeyIndex = 0;

function getClient() {
  return new GoogleGenAI({
    apiKey: apiKeys[currentKeyIndex],
  });
}

// ─── Custom error for rate limiting ───────────────────────────────────────
export class RateLimitError extends Error {
  constructor() {
    super("RATE_LIMIT");
    this.name = "RateLimitError";
  }
}

// ─── Retry: ONLY on 503, but switch key on 429 ─────────────────────────────
async function retryAI(fn: () => Promise<any>, retries = 3): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    const status = err?.status ?? err?.httpStatus ?? err?.code;

    // 🔥 429 → switch API key + retry
    if (status === 429) {
      console.warn("⚠️  Rate limit hit. Switching API key...");

      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

      console.log("🔑 Switched to key index:", currentKeyIndex);

      if (retries > 0) {
        return retryAI(fn, retries - 1);
      }

      throw new RateLimitError();
    }

    // 503 → retry with backoff
    if (retries > 0 && status === 503) {
      const delay = (4 - retries) * 1000;
      console.log(`🔁 Gemini busy (503), retrying in ${delay}ms… (${retries} left)`);
      await new Promise((res) => setTimeout(res, delay));
      return retryAI(fn, retries - 1);
    }

    throw err;
  }
}

// ─── Parse Job Description ─────────────────────────────────────────────────
export const parseJobDescription = async (jd: string) => {
  try {
    const response = await retryAI(() =>
      getClient().models.generateContent({
        model: "models/gemini-2.5-flash",
        contents: `
Return ONLY valid JSON. No explanation.

{
  "company": "",
  "role": "",
  "requiredSkills": [],
  "niceToHaveSkills": [],
  "seniority": "",
  "location": ""
}

Job Description:
${jd}
        `,
      })
    );

    const text = response.text;
    if (!text) throw new Error("No response text");

    console.log("RAW AI RESPONSE:", text);

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON found");

    return JSON.parse(match[0]);

  } catch (err) {
    if (err instanceof RateLimitError) throw err;

    console.error("AI parse error:", err);

    return {
      company: "Unknown",
      role: "Could not parse",
      requiredSkills: [],
      niceToHaveSkills: [],
      seniority: "",
      location: "",
    };
  }
};

// ─── Generate Resume Bullet Points ────────────────────────────────────────
export const generateResumePoints = async (jd: string) => {
  try {
    const response = await retryAI(() =>
      getClient().models.generateContent({
        model: "models/gemini-2.5-flash",
        contents: `
Return ONLY a JSON array of 3-5 resume bullet points.

Example:
[
  "Built scalable apps",
  "Optimized backend APIs"
]

Job Description:
${jd}
        `,
      })
    );

    const text = response.text;
    if (!text) throw new Error("No response text");

    console.log("RAW RESUME RESPONSE:", text);

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No array found");

    return JSON.parse(match[0]);

  } catch (err) {
    if (err instanceof RateLimitError) throw err;

    console.error("AI resume error:", err);

    return [
      "Worked on software development tasks",
      "Collaborated with team members",
      "Improved application performance",
    ];
  }
};