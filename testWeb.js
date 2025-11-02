require("dotenv").config();
const mongoose = require("mongoose");
const { handlePayOSWebhook } = require("./src/controllers/payOSController");
const Payment = require("./src/models/Payment");
const Membership = require("./src/models/Membership");
const User = require("./src/models/User");
const MembershipPackage = require("./src/models/MembershipPackage");

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error(err));

// Fake req/res
const fakeReq = {
  body: {
    code: "00",
    desc: "success",
    success: true,
    data: {
      orderCode: 1760687225, // orderCode của Payment cần test
      amount: 2000,
      description: "Buy Membership Bronze",
      paymentLinkId: "696d68de0833491bb89a31a18e262aaa",
    },
  },
  headers: {} // sandbox thì bỏ qua signature
};

const fakeRes = {
  status: function(code) { this.statusCode = code; return this; },
  json: function(data) { console.log("Webhook handler output:", data); return this; },
  redirect: function(url) { console.log("Redirect to:", url); return this; }
};

// Gọi trực tiếp
(async () => {
  try {
    await handlePayOSWebhook(fakeReq, fakeRes);

    // Check lại Payment & Membership
    const payment = await Payment.findOne({ orderCode: 1760684462 });
    const membership = await Membership.findOne({ ownerId: payment.ownerId, packageId: payment.membershipPackageId });
    console.log("Payment after webhook:", payment);
    console.log("Membership after webhook:", membership);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
