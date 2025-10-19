const Message = require('../models/Message');

// GET /api/messages/conversations
exports.getUserMessages = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const messages = await Message.find({ senderId: userId }).sort({ time: -1 });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

// POST /api/messages/
exports.sendMessage = async (req, res, next) => {
  try {
    const newMessage = new Message({
      senderId: req.user.id,
      chatId: req.body.chatId,
      content: req.body.content,
      time: new Date()
    });
    const saved = await newMessage.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
};
