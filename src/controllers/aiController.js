const { chatWithAIStreaming } = require("../service/aiService");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.chat = async (req, res) => {
  const { message, model } = req.body;
  if (!message) return res.status(400).send("Message is required");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    await chatWithAIStreaming(
      message,
      (chunk) => res.write(chunk),
      model
    );
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server AI");
  }
};

exports.analyzeSentiment = async (req, res) => {
  try {
    const { reviews } = req.body;
    if (!reviews || reviews.length === 0) {
      return res.status(400).json({ error: "Không có đánh giá nào được cung cấp." });
    }

    // Gộp các review thành một đoạn văn duy nhất
    const combinedText = reviews.join("\n");

    // Lấy model Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prompt hướng dẫn AI
    const prompt = `
    Bạn là một trợ lý phân tích cảm xúc (AI Sentiment Assistant).
    Nhiệm vụ của bạn là phân tích các đánh giá của người thuê về phòng trọ.
    - Với mỗi đánh giá, hãy xác định cảm xúc: Tích cực, Trung lập, hoặc Tiêu cực.
    - Sau đó, hãy tổng hợp tỉ lệ phần trăm của từng loại cảm xúc.
    - Cuối cùng, viết một đoạn tóm tắt ngắn (bằng tiếng Việt) mô tả những điểm người dùng khen và chê.

    Hãy trả lời bằng tiếng Việt, văn phong tự nhiên, dễ hiểu.

    Danh sách đánh giá:
    ${combinedText}
    `;

    // Gọi AI
    const result = await model.generateContent(prompt);
    const output = result.response.text();

    res.json({ summary: output });
  } catch (error) {
    console.error("Sentiment analysis error:", error);
    res.status(500).json({ error: "Phân tích cảm xúc thất bại" });
  }
};
