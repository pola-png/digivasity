import { GoogleGenAI } from "@google/genai";

const getGenAI = () => {
  // Try multiple ways to get the API key
  const apiKey = (process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
  
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    console.error("Gemini API Key is missing. process.env.GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);
    throw new Error("GEMINI_API_KEY is missing or invalid. Please ensure it is set in your environment settings.");
  }

  // Log key length for debugging (never log the key itself)
  console.log(`Initializing Gemini with key of length: ${apiKey.length}`);
  
  return new GoogleGenAI({ apiKey });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const parseErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  console.error("Gemini API Error Details:", error);

  try {
    let msg = error.message || '';
    let errorObj = error;
    
    // Recursively parse JSON strings
    let depth = 0;
    while (typeof msg === 'string' && msg.includes('{') && depth < 3) {
      try {
        const start = msg.indexOf('{');
        const end = msg.lastIndexOf('}') + 1;
        const parsed = JSON.parse(msg.substring(start, end));
        errorObj = parsed;
        msg = parsed.error?.message || parsed.message || '';
      } catch (e) {
        break;
      }
      depth++;
    }

    const apiError = errorObj.error || errorObj;
    const details = apiError.details || [];
    
    // Look for ErrorInfo
    const errorInfo = details.find((d: any) => d['@type']?.includes('ErrorInfo'));
    if (errorInfo) {
      const reason = errorInfo.reason;
      
      if (reason === 'API_KEY_INVALID') return "Invalid API Key. Please check your Gemini API key in settings.";
      if (reason === 'QUOTA_EXCEEDED') return "Quota exceeded. Please try again later or check your billing status.";
      if (reason === 'LOCATION_NOT_SUPPORTED' || reason === 'USER_LOCATION_NOT_SUPPORTED') {
        return "The Gemini API (or the Search tool) is not available in your current location.";
      }
      if (reason === 'ACCESS_TOKEN_EXPIRED') return "Session expired. Please refresh the page.";
      
      return `API Error: ${reason} ${apiError.message ? `- ${apiError.message}` : ''}`;
    }

    // Look for localized message
    const localizedMsg = details.find((d: any) => d['@type']?.includes('LocalizedMessage'));
    if (localizedMsg?.message) return localizedMsg.message;

    if (apiError.message && typeof apiError.message === 'string') {
      let cleanMsg = apiError.message;
      if (cleanMsg.includes('{')) {
        try {
          const parsed = JSON.parse(cleanMsg);
          if (parsed.error?.message) cleanMsg = parsed.error.message;
        } catch (e) {}
      }
      return cleanMsg;
    }
    
    if (apiError.status) return `API Error: ${apiError.status}`;

  } catch (e) {
    console.error("Error during error parsing:", e);
  }
  
  return error.message || "An unexpected error occurred. Please try again.";
};

async function* withRetry<T>(
  fn: () => Promise<AsyncIterable<T>>,
  maxRetries = 3,
  initialDelay = 1000
): AsyncIterable<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const stream = await fn();
      for await (const chunk of stream) {
        yield chunk;
      }
      return;
    } catch (error: any) {
      lastError = error;
      const errorStr = (JSON.stringify(error) + (error.message || "")).toLowerCase();
      
      const isRetryable = 
        errorStr.includes("503") || 
        errorStr.includes("high demand") ||
        errorStr.includes("unavailable") ||
        errorStr.includes("deadline exceeded") ||
        errorStr.includes("rate limit") ||
        errorStr.includes("429");
      
      if (isRetryable && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await sleep(delay);
        continue;
      }
      throw new Error(parseErrorMessage(error));
    }
  }
  throw new Error(parseErrorMessage(lastError));
}

export const chatWithGeminiStream = (message: string, systemInstruction?: string) => {
  return withRetry(async () => {
    const ai = getGenAI();
    const instruction = systemInstruction || "You are Digivasity AI, a helpful overseas education advisor.";
    const fullMessage = `System Instruction: ${instruction}\n\nUser Message: ${message}`;
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: fullMessage,
    });

    async function* textStream() {
      for await (const chunk of response) {
        yield chunk.text || "";
      }
    }
    return textStream();
  });
};

export const findUniversitiesStream = (profile: any) => {
  return withRetry(async () => {
    const ai = getGenAI();
    const prompt = `
      Find universities and courses for a student with the following profile:
      - Country of Residence: ${profile.residence}
      - Target Country for Study: ${profile.targetCountry}
      - Highest Academic Qualification: ${profile.qualification}
      - BSc CGPA: ${profile.cgpa}
      - English Test Score: ${profile.englishScore}
      - Course of Interest: ${profile.course}
      - Program of Interest: ${profile.program}

      Provide a shortlisted list of 3-5 universities in ${profile.targetCountry} that the student qualifies for. 
      
      CRITICAL: Prioritize universities with the CHEAPEST tuition fees available in ${profile.targetCountry} for this course.

      For each entry, include:
      1. University & Course Name
      2. Tuition Fees (Local & ${profile.residence} currency)
      3. Available Intakes (2026/2027)
      4. Application Status (Open/Closed/Opening Soon)
      5. Specific Scholarships

      FORMATTING: Use clear headings and bullet points. Double newline between entries.
    `;

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    async function* textStream() {
      for await (const chunk of response) {
        yield chunk.text || "";
      }
    }
    return textStream();
  });
};

export const calculatePOFStream = (data: any) => {
  return withRetry(async () => {
    const ai = getGenAI();
    const prompt = `
      Calculate Proof of Funds (POF) for:
      - Residence: ${data.residence}
      - Target: ${data.targetCountry}
      - University: ${data.university}
      - Program: ${data.program}
      - Dependants: ${data.dependants}

      Provide:
      1. Tuition Fees (1st year)
      2. Living Expenses (Student + ${data.dependants} dependants)
      3. Total Required POF
      4. Recommended Total (includes 10% buffer for currency fluctuation)
      5. Brief breakdown of visa financial rules for ${data.targetCountry}.

      CRITICAL: Show the "Recommended Total" clearly in ${data.residence} currency.
    `;

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    async function* textStream() {
      for await (const chunk of response) {
        yield chunk.text || "";
      }
    }
    return textStream();
  });
};

export const getVisaGuideStream = (data: any) => {
  return withRetry(async () => {
    const ai = getGenAI();
    const prompt = `
      Visa guide for ${data.nationality} student going to ${data.destination} for ${data.program}:

      Provide:
      1. Step-by-step checklist.
      2. Total cost (fees + health surcharge) in ${data.nationality} currency.
      3. Processing time & Approval rates.
      4. Top 3 tips to avoid rejection.
    `;

    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    async function* textStream() {
      for await (const chunk of response) {
        yield chunk.text || "";
      }
    }
    return textStream();
  });
};
