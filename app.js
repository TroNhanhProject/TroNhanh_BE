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

//  BoardingHouse routes
const boardingHouseRoutes = require("./src/routes/boardingHouseRoutes");
app.use("/api/boarding-houses", boardingHouseRoutes);

// Room routes
const roomRoutes = require("./src/routes/roomRoutes");
app.use("/api/rooms", roomRoutes);

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

// // Socket
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:3000", // cổng của frontend
//     methods: ["GET", "POST"],
//   },
// });

// io.on("connection", (socket) => {
//   console.log("🟢 A user connected:", socket.id);

//   socket.on("joinRoom", (roomId) => {
//     socket.join(roomId);
//     console.log(`${socket.id} joined room ${roomId}`);
//   });

//   socket.on("disconnect", () => {
//     console.log("🔴 A user disconnected:", socket.id);
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});