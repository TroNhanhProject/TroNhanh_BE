const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const socketIo = require("socket.io");
const http = require("http");

require("dotenv").config();
const crypto = require("crypto");
const Payment = require("./src/models/Payment"); 
const Booking = require("./src/models/Booking");
const http = require('http'); 
const { Server } = require("socket.io");
require("./src/service/cancelExpiredBookings");

const PORT = process.env.PORT;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});
app.use((req, res, next) => {
  req.io = io;
  next();
});
io.on('connection', (socket) => {
  console.log('A user connected');

  // Cho user tham gia một "phòng" riêng, đặt tên bằng userId của họ
  // Client sẽ gửi sự kiện này sau khi kết nối
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`User ${userId} joined room ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});
app.use(cors()); //Share tai nguyen giua cac cong khac nhau

const { handlePayOSWebhook } = require("./src/controllers/payOSController");


// Dành cho PayOS xác thực URL
app.get("/api/payment/webhook", (req, res) => {
    console.log("!!!!!!!!!! BẮT ĐƯỢC REQUEST GET XÁC THỰC !!!!!!!!!!");
    res.status(200).json({ message: "DEBUG SUCCESS: GET request received!" });
});

// Dành cho PayOS gửi dữ liệu thanh toán
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), async (req, res) => { // Thêm async ở đây
    console.log("!!!!!!!!!! BẮT ĐƯỢC REQUEST WEBHOOK !!!!!!!!!!");

    try {
        const isSandbox = process.env.PAYOS_USE_SANDBOX === "true";

        console.log("📌 Headers webhook:", req.headers);
        console.log("📌 Raw body type:", typeof req.body, req.body instanceof Buffer);

        // --- Signature check ---
        if (!isSandbox) {
            const signature = req.headers["x-signature"];
            if (!(req.body instanceof Buffer)) {
                throw new Error("req.body is not a Buffer, cannot compute signature");
            }
            const computedSig = crypto
                .createHmac("sha256", process.env.PAYOS_CHECKSUM_KEY)
                .update(req.body)
                .digest("hex");
            if (computedSig !== signature) {
                console.log("❌ Invalid PayOS signature");
                return res.status(400).json({ message: "Invalid signature" });
            }
        } else {
            console.log("⚠️ Sandbox mode: skip signature check");
        }

        // --- Parse dữ liệu webhook ---
        let data;
        if (req.body instanceof Buffer) {
            data = JSON.parse(req.body.toString());
        } else if (typeof req.body === "object") {
            data = req.body;
        } else {
            throw new Error("Invalid request body");
        }

        console.log("📌 Webhook data:", data);
        if (!data || !data.data) {
            console.log("⚠️ Webhook received but data or data.data is missing. Ignoring.");
            return res.status(200).json({ message: "Webhook received but no relevant data to process." });
        }
        const { orderCode, code, desc } = data.data;

        // Code logic nghiệp vụ của em
        const payment = await Payment.findOne({ orderCode });
        if (!payment) {
            console.log(`⚠️ Payment with orderCode ${orderCode} not found.`);
            return res.status(200).json({ message: "Payment not found but webhook acknowledged." });
        }
        
        if (code === "00" || desc?.toLowerCase().includes("thành công")) {
            payment.status = "Paid";
            payment.completedAt = new Date();
            await payment.save();

            if (payment.bookingId) {
                await Booking.findByIdAndUpdate(payment.bookingId, { status: "paid" });
            }
            console.log(`✅ Payment ${orderCode} marked as PAID`);
        } else {
            payment.status = "Failed";
            await payment.save();
            console.log(`❌ Payment ${orderCode} failed`);
        }

        return res.status(200).json({ message: "Webhook processed successfully" });
    } catch (error) {
        console.error("❌ Error in PayOS webhook:", error);
        res.status(500).json({ message: "Internal server error" });
    }
    // =================== XÓA DÒNG NÀY ĐI ===================
    // res.status(200).json({ message: "DEBUG SUCCESS: Webhook received!" }); // Dòng này bị thừa
    // =======================================================
});

// Sau đó mới dùng JSON cho các route khác
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

// Ai routes
const aiRoutes = require("./src/routes/aiRoutes")
app.use("/api/ai", aiRoutes);
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

const visitRequestRoutes = require('./src/routes/visitRequestRoutes');
app.use('/api/visit-requests', visitRequestRoutes);
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});