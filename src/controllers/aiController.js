// controllers/chatController.js
import { chatWithAIStreaming } from "../service/aiService.js";

export const chat = async (req, res) => {
  const { message, model } = req.body;
  if (!message) {
    return res.status(400).send("Message is required");
  }

  // Header để hỗ trợ streaming
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    await chatWithAIStreaming(
      message,
      (chunk) => {
        // Gửi chunk về frontend ngay lập tức
        res.write(chunk);
      },
      model
    );

    res.end(); // kết thúc streaming sau khi tất cả các chunk đã được gửi
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server AI");
  }
};