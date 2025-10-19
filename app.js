const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");

require("dotenv").config();

const PORT = process.env.PORT;
const app = express();

app.use(cors()); //Share tai nguyen giua cac cong khac nhau
app.use(express.json());
app.use("/uploads", express.static("uploads"));

//Connect DB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

//Routes
//Accomodation, User,...

app.get("/", (req, res) => {
  res.send("Welcome to TRO-NHANH");
});

//  Auth routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

//  Profile routes
const profileRoutes = require("./src/routes/profileRoutes");
app.use("/api/customer", profileRoutes);


app.use("/api/owner", (req, res, next) => {
  next();
});

//  Owner routes
const ownerRoutes = require("./src/routes/ownerRoutes");
app.use("/api/owner", ownerRoutes);

//  BoardingHouse routes
const boardingHouseRoutes = require("./src/routes/boardingHouseRoutes");
app.use("/api/boarding-houses", boardingHouseRoutes);

// Room routes
const roomRoutes = require("./src/routes/roomRoutes");
app.use("/api/rooms", roomRoutes);

// Contract routes
const contractRoutes = require("./src/routes/contractRoutes");
app.use("/api/contracts", contractRoutes);

// Booking routes
const bookingRoutes = require("./src/routes/bookingRoutes");
app.use("/api/bookings", bookingRoutes);

//  Favorite routes
const favoriteRoutes = require("./src/routes/favoritesRoutes");
app.use("/api/favorites", favoriteRoutes);

// Chat Routes
const chatRoutes = require("./src/routes/chatRoutes");
app.use("/api/chats", chatRoutes);

// Message Routes
const messageRoutes = require("./src/routes/messageRoutes");
app.use("/api/messages", messageRoutes);

//  Roommate routes
const roommateRoutes = require("./src/routes/roommateRoutes");
app.use("/api/roommates", roommateRoutes);

//  Report routes
const reportRoutes = require("./src/routes/reportRoutes");
app.use("/api/reports", reportRoutes);

//  Admin routes
const adminRoutes = require("./src/routes/adminRoutes");
app.use("/api/admin", adminRoutes);

//  Membership routes
const membershipRoutes = require("./src/routes/membershipRoutes");
app.use("/api/membership-packages", membershipRoutes);

//  Payment routes
const paymentRoutes = require("./src/routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// --- Socket.IO setup ---
const server = http.createServer(app);
const onlineUsers = new Map();
const busyUsers = new Set();

function broadcastOnlineUsers(io) {
  io.emit("online-users", Array.from(onlineUsers.keys()));
}

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 25000,
  pingInterval: 20000,
});

// Make io accessible in routes/controllers
app.set("io", io);

// Middleware to attach userId from handshake
io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.data.userId = userId;
  }
  next();
});

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // If userId was provided at connect time, mark online immediately
  if (socket.data.userId) {
    const userId = socket.data.userId;
    onlineUsers.set(userId, socket.id);
    broadcastOnlineUsers(io);
    socket.join(`user:${userId}`);
    socket.emit("user-added", { ok: true, socketId: socket.id });
    console.log(`👤 User ${userId} is now online with socket ${socket.id}`);
  }

  // Fallback: legacy add-user event
  socket.on("add-user", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    socket.emit("user-added", { ok: true, socketId: socket.id });
    console.log(`👤 User ${userId} added with socket ${socket.id}`);
    broadcastOnlineUsers(io);
  });

  // ===== CHAT EVENTS =====

  // Join a chat room
  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(`room:${roomId}`);
    console.log(`🚪 User ${socket.data.userId} joined room ${roomId}`);
    socket.to(`room:${roomId}`).emit("user-joined", {
      userId: socket.data.userId,
      roomId,
    });
  });

  // Leave a chat room
  socket.on("leaveRoom", (roomId) => {
    if (!roomId) return;
    socket.leave(`room:${roomId}`);
    console.log(`🚪 User ${socket.data.userId} left room ${roomId}`);
    socket.to(`room:${roomId}`).emit("user-left", {
      userId: socket.data.userId,
      roomId,
    });
  });

  // Send message to room
  socket.on("sendMessage", ({ roomId, message }) => {
    if (!roomId || !message) return;
    const payload = {
      roomId,
      message,
      senderId: socket.data.userId,
      createdAt: new Date().toISOString(),
    };
    console.log(`💬 Message sent to room ${roomId} by user ${socket.data.userId}`);
    io.to(`room:${roomId}`).emit("newMessage", payload);
  });

  // Typing indicator
  socket.on("typing", ({ roomId, isTyping }) => {
    if (!roomId) return;
    socket.to(`room:${roomId}`).emit("typing", {
      userId: socket.data.userId,
      roomId,
      isTyping: !!isTyping,
    });
  });

  // ===== WEBRTC SIGNALING EVENTS =====

  // WebRTC Offer
  socket.on("webrtc-offer", ({ toUserId, roomId, offer }) => {
    if (!offer) return;
    console.log(`📞 WebRTC offer from ${socket.data.userId}`);

    if (toUserId) {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("webrtc-offer", {
          fromUserId: socket.data.userId,
          offer,
        });
      } else {
        socket.emit("user-offline", { toUserId });
      }
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-offer", {
        fromUserId: socket.data.userId,
        roomId,
        offer,
      });
    }

    busyUsers.add(socket.userId);
    io.to(toUserId).emit("webrtc-offer", { fromUserId: socket.userId, offer });
  });

  // WebRTC Answer
  socket.on("webrtc-answer", ({ toUserId, roomId, answer }) => {
    if (!answer) return;
    console.log(`📞 WebRTC answer from ${socket.data.userId}`);

    if (toUserId) {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("webrtc-answer", {
          fromUserId: socket.data.userId,
          answer,
        });
      }
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-answer", {
        fromUserId: socket.data.userId,
        roomId,
        answer,
      });
    }
  });

  // WebRTC ICE Candidate
  socket.on("webrtc-ice-candidate", ({ toUserId, roomId, candidate }) => {
    if (!candidate) return;
    console.log(`🧊 ICE candidate from ${socket.data.userId}`);

    if (toUserId) {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("webrtc-ice-candidate", {
          fromUserId: socket.data.userId,
          candidate,
        });
      }
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-ice-candidate", {
        fromUserId: socket.data.userId,
        roomId,
        candidate,
      });
    }
  });

  // End call
  socket.on("end-call", ({ toUserId, roomId }) => {
    console.log(`📴 Call ended by ${socket.data.userId}`);

    if (toUserId) {
      const targetSocket = onlineUsers.get(toUserId);
      if (targetSocket) {
        io.to(targetSocket).emit("end-call", {
          fromUserId: socket.data.userId,
        });
      }
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("end-call", {
        fromUserId: socket.data.userId,
        roomId,
      });
    }
  });

  // check if the caller is calling a busy receiver
  // socket.on("check-busy", ({ toUserId }) => {
  //   const targetSocket = onlineUsers.get(toUserId);
  //   if (targetSocket && busyUsers.has(toUserId)) {
  //     socket.emit("busy-response", { busy: true });
  //   } else {
  //     socket.emit("busy-response", { busy: false });
  //   }
  // });

  socket.on("end-call", ({ toUserId }) => {
    busyUsers.delete(socket.userId);
    io.to(toUserId).emit("end-call", { fromUserId: socket.userId });
  });

  // ping/pong
  socket.on("ping", () => {
    socket.emit("pong");
  });

  // Handle disconnect
  socket.on("disconnect", (reason) => {
    const userId = socket.data.userId;
    if (userId && onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);
      broadcastOnlineUsers(io);
      console.log(`🔴 User ${userId} disconnected (${reason})`);
    }
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});