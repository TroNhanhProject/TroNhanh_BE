const { chatWithAIStreaming } = require("../service/aiService");

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
