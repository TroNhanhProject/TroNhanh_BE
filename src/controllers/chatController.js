const mongoose = require("mongoose");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.getOrCreateChat = async (req, res) => {
  const { user1Id, user2Id } = req.body;

  console.log("user1Ids:", user1Id);
  console.log("user2Ids:", user2Id);

  try {
    if (!user1Id || !user2Id) {
      return res.status(400).json({ error: "Both user1Ids and user2Ids are required" });
    }

    const u1 = new mongoose.Types.ObjectId(user1Id);
    const u2 = new mongoose.Types.ObjectId(user2Id);

    let chat = await Chat.findOne({
      $or: [
        { user1Id: u1, user2Id: u2 },
        { user1Id: u2, user2Id: u1 },
      ],
    });

    if (!chat) {
      try {
        chat = await Chat.create({ user1Id: u1, user2Id: u2 });
      } catch (createErr) {
        // Handle duplicate-key errors caused by legacy/other-indexes in DB
        if (createErr && createErr.code === 11000) {
          console.warn('Duplicate key on Chat.create, attempting to resolve by finding existing chat', createErr);
          // Try to locate an existing chat document that relates these two users using several possible field patterns
          // This covers legacy documents that used `customerId`/`ownerId`/`accommodationId` unique index
          chat = await Chat.findOne({
            $or: [
              { user1Id: u1, user2Id: u2 },
              { user1Id: u2, user2Id: u1 },
              // legacy pattern: customer/owner fields may be present
              {
                $and: [
                  { customerId: { $in: [u1, u2] } },
                  { ownerId: { $in: [u1, u2] } },
                ],
              },
              // also try matching by any fields that include both ids
              { customerId: u1, ownerId: u2 },
              { customerId: u2, ownerId: u1 },
            ],
          });
        }

        if (!chat) throw createErr; // rethrow if still not resolved
      }
    }

    res.status(200).json(chat);
  } catch (err) {
    console.error("Error in getOrCreateChat:", err);
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

    // update chat's updatedAt & optionally lastMessage content
    await Chat.findByIdAndUpdate(chatId, {
      updatedAt: new Date(),
    });

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserChats = async (req, res) => {
  const userId = req.params.userId;

  try {
    const chats = await Chat.find({
      $or: [{ user1Id: userId }, { user2Id: userId }]
    })
      .populate('user1Id', 'name avatar')
      .populate('user2Id', 'name avatar')
      .sort({ updatedAt: -1 }) // sắp xếp theo thời gian
      .lean(); // trả về JS object

    // Gắn thêm lastMessage
    for (let chat of chats) {
      const lastMsg = await Message.findOne({ chatId: chat._id }).sort({ createdAt: -1 });
      chat.lastMessage = lastMsg;
    }

    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
