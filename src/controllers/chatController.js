const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.getOrCreateChat = async (req, res) => {
  const { userId, ownerId } = req.body;

  try {
    let chat = await Chat.findOne({
      $or: [
        { userId, ownerId },
        { userId: ownerId, ownerId: userId },
      ],
    });

    if (!chat) {
      chat = await Chat.create({ userId, ownerId });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).populate(
      "senderId",
      "name avatar"
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  const { chatId, senderId, content } = req.body;

  try {
    const message = await Message.create({ chatId, senderId, content });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
