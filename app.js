// file TroNhanh_BE/app.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const PORT = process.env.PORT;
const app = express();

//  Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

//  Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

//  Test route
app.get('/', (req, res) => {
    res.send('Welcome to TRO-NHANH');
});

//  Auth routes
const authRoutes = require('./src/routes/authRoutes');
app.use('/api/auth', authRoutes);

//  Profile routes
const profileRoutes = require('./src/routes/profileRoutes');
app.use('/api/customer', profileRoutes);

//  Accommodation routes
const accommodationRoutes = require('./src/routes/accommodationRoutes');
console.log("Accommodation route connected ✅");
app.use('/api/accommodation', accommodationRoutes);

const favoriteRoutes = require('./src/routes/favoritesRoutes')
app.use('/api/favorites', favoriteRoutes);

const roommateRoutes = require('./src/routes/roommateRoutes')
app.use('/api/roommates', roommateRoutes)

//  Admin routes
const adminRoutes = require('./src/routes/adminRoutes');
console.log("Admin route connected ✅");
app.use('/api/admin', adminRoutes);

//  Membership routes
const membershipRoutes = require('./src/routes/membershipRoutes');
console.log("✅ membershipRoutes connected");
app.use('/api/membership-packages', membershipRoutes);

//  Payment routes
const paymentRoutes = require('./src/routes/paymentRoutes');
app.use('/api/payment', paymentRoutes);

// Owner Report routes
const reportRoutes = require('./src/routes/reportRoutes');
app.use('/api/reports', reportRoutes);


//  Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

//  Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

