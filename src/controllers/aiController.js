const { chatWithAIStreaming } = require("../service/aiService");
const { buildAIContext } = require("./aiDataController");

exports.chat = async (req, res) => {
  const { message } = req.body;
  const user = req.user;
  const role = user?.role || "guest";

  if (!message) return res.status(400).send("Message is required");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    // 🧠 Tách phần xử lý dữ liệu sang aiDataController
    const promptContext = await buildAIContext(role, user, message);

    // 🎯 Gọi AI sinh phản hồi
    await chatWithAIStreaming(promptContext, message, (chunk) =>
      res.write(chunk)
    );

    res.end();
  } catch (err) {
    console.error("AI Chat error:", err);
    res.status(500).send("Lỗi server AI");
  }
};
