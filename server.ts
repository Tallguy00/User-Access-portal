import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required to run the Ask AI feature.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const FAQ_CONTEXT = [
  {
    category: 'Access Requests',
    question: 'How do I submit a new access request?',
    answer: 'Navigate to New Request, complete the required fields, and submit the form. You can track its progress in My Requests.'
  },
  {
    category: 'Access Requests',
    question: 'How can I check the status of my request?',
    answer: 'Open My Requests to view statuses such as Pending, Approved, Rejected, or Completed.'
  },
  {
    category: 'Access Requests',
    question: 'Can I edit a request after submitting it?',
    answer: 'Requests can only be edited while they are in the Draft state. Submitted requests cannot be modified unless returned by an approver.'
  },
  {
    category: 'Approvals',
    question: 'Why was my request rejected?',
    answer: 'Open the request details to view the rejection reason provided by the approver.'
  },
  {
    category: 'Notifications',
    question: 'How will I know when my request is approved?',
    answer: 'You will receive an in-app notification and, if enabled, an email notification.'
  },
  {
    category: 'Security',
    question: 'How do I change my password?',
    answer: 'Go to Profile → Security and select Change Password.'
  },
  {
    category: 'Account',
    question: 'How do I update my profile information?',
    answer: 'Open Profile Settings, edit your information, and save your changes.'
  },
  {
    category: 'Technical Support',
    question: 'Who should I contact if I need help?',
    answer: 'Contact your system administrator or the IT support team using the Support page.'
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/ask-ai", async (req, res) => {
    const { question, history } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    try {
      const ai = getGeminiClient();

      // Format FAQs context for the model
      const faqsFormatted = FAQ_CONTEXT.map((faq, index) => {
        return `FAQ #${index + 1} (${faq.category}):\nQ: ${faq.question}\nA: ${faq.answer}`;
      }).join("\n\n");

      const systemInstruction = `You are a helpful, professional, and friendly AI Support Assistant for the "User Access Request Portal".
Your primary goal is to answer the user's questions using the official Frequently Asked Questions (FAQ) provided below.

Official FAQ Context:
${faqsFormatted}

Guidelines for responding:
1. Always prioritize answers found directly in the Official FAQ Context.
2. If the user's query is closely related to an FAQ but phrased differently, map it to the correct answer.
3. If the user's query cannot be answered by the Official FAQs, use your general knowledge of corporate IT support, identity governance, access requests, role assignments, and standard IT administration (e.g. Active Directory, MFA, role management) to provide a helpful, constructive answer.
4. However, if you answer using general knowledge rather than the official FAQs, kindly and gently mention: "(Note: This information is based on general IT support guidelines, as it is not explicitly covered in our official portal FAQs.)".
5. Keep answers concise, clear, and easy to read. Use markdown bullet points, bold text, or numbered lists if explaining steps. Do not mention system-internal paths, code repositories, or implementation details.`;

      // Build chat contents sequence
      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: question }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({ answer: response.text || "I apologize, but I could not formulate a response." });
    } catch (error: any) {
      console.error("Gemini API Error in /api/ask-ai:", error);
      res.status(500).json({ error: error.message || "Failed to generate answer from Gemini." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
