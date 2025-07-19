const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.getOrCreateChat = async (req, res) => {
  const { user1Id, user2Id } = req.body;

  try {
    let chat = await Chat.findOne({
      $or: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    });

    if (!chat) {
      chat = await Chat.create({ user1Id, user2Id });
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
  console.log("Sending message:", { chatId, senderId, content });

  try {
    const message = await Message.create({ chatId, senderId, content });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};