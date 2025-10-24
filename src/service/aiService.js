// services/aiService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Chat với Gemini Pro và streaming phản hồi
 * @param {string} message - Tin nhắn của người dùng
 * @param {function} onChunk - Callback được gọi với mỗi chunk phản hồi
 * @param {string} model - Tên mô hình
 */
const chatWithAIStreaming = async (message, onChunk, model = "gemini-2.5-flash") => {
  let attempt = 0;
  const maxRetries = 3;

  while (attempt < maxRetries) {
    try {
      const modelInstance = genAI.getGenerativeModel({ model });
      const result = await modelInstance.generateContentStream({
        contents: [{ role: "user", parts: [{ text: message }] }],
      });

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) onChunk(chunkText);
      }
      return; // thành công thì thoát khỏi loop

    } catch (err) {
      if (err.status === 503 && attempt < maxRetries - 1) {
        console.warn(`⚠️ Gemini quá tải, thử lại (${attempt + 1}/${maxRetries})...`);
        await new Promise(r => setTimeout(r, 1500)); // chờ 1.5s
        attempt++;
      } else {
        console.error("Gemini API stream error:", err);
        throw new Error("Lỗi khi gọi Gemini API");
      }
    }
  }
};


module.exports = { chatWithAIStreaming };
