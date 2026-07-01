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

function getLocalFallbackResponse(question: string): string {
  const lower = question.toLowerCase();
  
  const matches = [
    { faqIndex: 0, keywords: ["submit", "create", "new request", "request access", "how to submit", "how to request"] },
    { faqIndex: 1, keywords: ["status", "check", "progress", "track", "where is", "pending", "completed"] },
    { faqIndex: 2, keywords: ["edit", "modify", "change", "draft", "updating", "update request"] },
    { faqIndex: 3, keywords: ["rejected", "rejection", "reject", "why was", "denied"] },
    { faqIndex: 4, keywords: ["approved", "approve", "approved request", "notification", "alert", "email"] },
    { faqIndex: 5, keywords: ["password", "credential", "reset", "forgot"] },
    { faqIndex: 6, keywords: ["profile", "job", "title", "department", "email", "phone"] },
    { faqIndex: 7, keywords: ["contact", "help", "support", "admin", "administrator", "agent", "ticket", "issue"] },
    { faqIndex: 8, keywords: ["urgent", "expedite", "fast", "priority", "rush", "high priority", "escalate"] },
    { faqIndex: 9, keywords: ["how long", "duration", "hours", "days", "time", "approval take", "timeline"] },
    { faqIndex: 10, keywords: ["mfa", "multi-factor", "authenticator", "lockout", "mfa reset", "token", "factor"] },
    { faqIndex: 11, keywords: ["role", "user role", "manager", "support role", "privileges", "permissions", "user vs manager"] },
    { faqIndex: 12, keywords: ["session", "parameters", "compliance", "host tunnel", "tls", "connection"] }
  ];

  let bestFaqIndex = -1;
  let maxScore = 0;

  for (const match of matches) {
    let score = 0;
    for (const kw of match.keywords) {
      if (lower.includes(kw)) {
        score += kw.split(" ").length;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestFaqIndex = match.faqIndex;
    }
  }

  const noticePrefix = `*(Note: The live AI service is currently undergoing high-demand maintenance. Here is the relevant article retrieved from our local Knowledge Base:)*\n\n`;

  if (bestFaqIndex !== -1) {
    const faq = FAQ_CONTEXT[bestFaqIndex];
    return `${noticePrefix}### **${faq.question}**\n\n${faq.answer}\n\n*If you have additional questions, please submit an IT Support Ticket under the **Support** tab.*`;
  }

  return `${noticePrefix}### **User Access Request Portal Help**

We are temporarily operating on local fallback mode due to high AI service traffic. Here are quick shortcuts to help you:

1. **Submit Access Request**: Click on the **New Request** button, select the target system/parameters, and submit.
2. **Check Status**: Visit the **My Requests** section on your dashboard.
3. **Change Password**: Go to **Profile** ➔ **Security settings**.
4. **IT Support Tickets**: If you are experiencing technical difficulties, please go to the **Support** tab to submit an issue ticket directly to our IT Admin team.

*Our AI service will automatically restore shortly.*`;
}

async function generateWithRetryAndFallback(ai: GoogleGenAI, contents: any[], systemInstruction: string, question: string): Promise<string> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  
  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Gemini Request] Model: ${model}, Attempt: ${attempt}`);
        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (error: any) {
        console.warn(`[Gemini Error] Model ${model}, Attempt ${attempt} failed:`, error.message || error);
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  }

  console.warn(`[Gemini Fallback] All Gemini API models failed. Generating locally optimized response.`);
  return getLocalFallbackResponse(question);
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
  },
  {
    category: 'Access Requests',
    question: 'How do I request urgent or expedited review for my request?',
    answer: 'You can toggle the "Urgent Priority" status indicator during request creation. This alerts Department Managers and IT Admins of critical deadlines. You can also open an urgent ticket via the Support channel if immediate escalation is necessary.'
  },
  {
    category: 'Approvals',
    question: 'How long do access request approvals typically take?',
    answer: 'Standard department requests are typically processed within 24 to 48 business hours by your designated supervisor or manager. System-level security clearances may require additional security review by IT Admins.'
  },
  {
    category: 'Security',
    question: 'How does Multi-Factor Authentication (MFA) work and how do I reset it?',
    answer: 'MFA is enforced across the IdentityFlow gateway to satisfy modern zero-trust policies. If you are locked out or need to register a new authenticator token, submit an "MFA Lockout / Reset" support ticket in the Support tab. An IT Admin will verify your identity and generate a reset link.'
  },
  {
    category: 'Account',
    question: 'What do the different workspace roles mean (User, Manager, IT Support)?',
    answer: 'Your workspace role determines your access: "User" is the standard level for submitting/tracking personal requests. "Manager" enables supervisors to review and approve departmental access and bulk workflows. "IT Support" and "IT Admin" possess system-wide view, user administration, and security control privileges.'
  },
  {
    category: 'Security',
    question: 'What are the "Session Parameters" displayed on the sidebar?',
    answer: 'Session parameters display your active identity governance state, including your connection security level, MFA enforcement compliance, and Cloud Run host tunnel architecture. This ensures full auditing compliance for corporate data access.'
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

  app.post(["/api/ask", "/api/ask-ai"], async (req, res) => {
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

      const answer = await generateWithRetryAndFallback(ai, contents, systemInstruction, question);

      res.json({ answer: answer || "I apologize, but I could not formulate a response." });
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
