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

// Keep track of online users for direct signaling (userId -> socketId)
const onlineUsers = new Map();

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 25000,
  pingInterval: 20000,
});

// Make io accessible in routes/controllers if needed
app.set("io", io);

// Attach userId from handshake so the user is marked online immediately
io.use((socket, next) => {
  const userId = socket.handshake.auth?.userId;
  if (userId) socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // If userId was provided at connect time, mark online right away
  if (socket.data.userId) {
    const userId = socket.data.userId;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    socket.emit("user-added", { ok: true, socketId: socket.id });
  }

  // Optional: reply to custom ping (Socket.IO already does internal ping/pong)
  socket.on("ping", () => socket.emit("pong"));

  // ...existing code...
  socket.on("add-user", (userId) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    socket.data.userId = userId;
    socket.join(`user:${userId}`);
    socket.emit("user-added", { ok: true, socketId: socket.id });
  });

  // Chat rooms
  socket.on("joinRoom", (roomId) => {
    if (!roomId) return;
    socket.join(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit("user-joined", {
      userId: socket.data.userId,
      roomId,
    });
  });

  socket.on("leaveRoom", (roomId) => {
    if (!roomId) return;
    socket.leave(`room:${roomId}`);
    socket.to(`room:${roomId}`).emit("user-left", {
      userId: socket.data.userId,
      roomId,
    });
  });

  // Chat message broadcast (persist to DB in your REST handler as needed)
  socket.on("sendMessage", ({ roomId, message }) => {
    if (!roomId || !message) return;
    const payload = {
      roomId,
      message,
      senderId: socket.data.userId,
      createdAt: new Date().toISOString(),
    };
    io.to(`room:${roomId}`).emit("newMessage", payload);
  });

  // Typing indicators
  socket.on("typing", ({ roomId, isTyping }) => {
    if (!roomId) return;
    socket.to(`room:${roomId}`).emit("typing", {
      userId: socket.data.userId,
      roomId,
      isTyping: !!isTyping,
    });
  });

  // WebRTC signaling - either direct to userId or to everyone else in room
  socket.on("webrtc-offer", ({ toUserId, roomId, offer }) => {
    if (!offer) return;
    if (toUserId) {
      const target = onlineUsers.get(toUserId);
      if (target) io.to(target).emit("webrtc-offer", { fromUserId: socket.data.userId, offer });
      else socket.emit("user-offline", { toUserId });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-offer", { fromUserId: socket.data.userId, roomId, offer });
    }
  });

  socket.on("webrtc-answer", ({ toUserId, roomId, answer }) => {
    if (!answer) return;
    if (toUserId) {
      const target = onlineUsers.get(toUserId);
      if (target) io.to(target).emit("webrtc-answer", { fromUserId: socket.data.userId, answer });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-answer", { fromUserId: socket.data.userId, roomId, answer });
    }
  });

  socket.on("webrtc-ice-candidate", ({ toUserId, roomId, candidate }) => {
    if (!candidate) return;
    if (toUserId) {
      const target = onlineUsers.get(toUserId);
      if (target) io.to(target).emit("webrtc-ice-candidate", { fromUserId: socket.data.userId, candidate });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("webrtc-ice-candidate", { fromUserId: socket.data.userId, roomId, candidate });
    }
  });

  socket.on("end-call", ({ toUserId, roomId }) => {
    if (toUserId) {
      const target = onlineUsers.get(toUserId);
      if (target) io.to(target).emit("end-call", { fromUserId: socket.data.userId });
    } else if (roomId) {
      socket.to(`room:${roomId}`).emit("end-call", { fromUserId: socket.data.userId, roomId });
    }
  });

  socket.on("disconnect", () => {
    const userId = socket.data.userId;
    if (userId && onlineUsers.get(userId) === socket.id) {
      onlineUsers.delete(userId);
    }
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});