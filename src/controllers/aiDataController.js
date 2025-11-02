// src/utils/buildAIContext.js
const BoardingHouse = require("../models/BoardingHouse");
const Review = require("../models/Reviews");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const MemberShip = require("../models/MemberShip");
const Favorite = require("../models/Favorite");
const Report = require("../models/Report");
const User = require("../models/User");

exports.buildAIContext = async (role, user, message) => {
  let promptContext = "";
  const lowerMsg = message.toLowerCase();

  // ============================ Helper ============================
  const getTopRatedHouses = async (limit = 5) => {
    const houses = await BoardingHouse.find({ approvedStatus: "approved" }).lean();
    const housesWithRating = [];
    for (let h of houses) {
      const reviews = await Review.find({ boardingHouseId: h._id }).lean();
      if (reviews.length === 0) continue; // chỉ lấy nhà trọ có review
      const avgRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
      const rooms = await Room.find({ boardingHouseId: h._id }).lean();
      const availableRooms = rooms.filter(r => r.status === "Available").length;
      housesWithRating.push({ ...h, avgRating, availableRooms });
    }
    return housesWithRating.sort((a,b)=>b.avgRating - a.avgRating).slice(0, limit);
  };

  const getAvailableRooms = async () => {
    const houses = await BoardingHouse.find({ approvedStatus: "approved" }).lean();
    const allRooms = [];
    for (let h of houses) {
      const rooms = await Room.find({ boardingHouseId: h._id, status: 'Available' }).lean();
      rooms.forEach(r => allRooms.push({ ...r, houseName: h.name, houseLocation: h.location }));
    }
    return allRooms;
  };

  // ============================ ROLE: GUEST ============================
  if (role === "guest") {
    const topHouses = await getTopRatedHouses();
    const allRooms = await getAvailableRooms();
    const cheapestRoom = allRooms.sort((a,b)=>a.price - b.price)[0];

    const topHousesHTML = topHouses.length
      ? topHouses.map((h,i)=>`#${i+1}. <b>${h.name}</b> – ${h.location.district} (⭐ ${h.avgRating}/5, ${h.availableRooms} phòng trống)`).join("<br>")
      : "Hiện tại chưa có nhà trọ nào có đánh giá.";

    const cheapestText = cheapestRoom
      ? `Phòng trọ rẻ nhất hiện có: <b>${cheapestRoom.houseName}</b> – Phòng ${cheapestRoom.roomNumber} – Giá: ${cheapestRoom.price} VND – ${cheapestRoom.houseLocation.district}`
      : "Hiện tại chưa có phòng trống nào.";

    const guestCases = [
      { keywords: ["giá rẻ","rẻ nhất"], content: cheapestText },
      { keywords: ["tốt nhất","đánh giá cao","phòng đẹp"], content: topHousesHTML },
      { keywords: ["tiện ích","wifi","máy giặt"], content: "Bạn có thể đăng nhập để lọc theo tiện ích." },
      { keywords: ["vị trí","quận","phường"], content: "Bạn có thể đăng nhập để lọc theo khu vực." },
      { keywords: ["chủ trọ","owner"], content: "Bạn có thể đăng nhập để xem thông tin chủ trọ." }
    ];

    const matched = guestCases.find(c=>c.keywords.some(k=>lowerMsg.includes(k)));
    const answer = matched ? matched.content : `${cheapestText}<br>${topHousesHTML}`;

    promptContext = `
Bạn là trợ lý AI của ứng dụng <b>Trọ Nhanh</b>.
Người dùng là <b>Khách chưa đăng nhập</b>, họ hỏi: "${message}"

🎯 Trả lời:
${answer}
    `;
  }

  // ============================ ROLE: CUSTOMER ============================
  else if (role === "customer") {
    const favorites = await Favorite.find({ customerId: user.id }).populate("boardingHouseId").lean();
    const bookings = await Booking.find({ userId: user.id }).populate("boardingHouseId roomId").lean();
    const topHouses = await getTopRatedHouses();
    const allRooms = await getAvailableRooms();
    const cheapestRoom = allRooms.sort((a,b)=>a.price - b.price)[0];
    const myReviews = await Review.find({ customerId: user.id }).populate("boardingHouseId").lean();

    const favoriteText = favorites.length ? favorites.map(f=>f.boardingHouseId?.name).join(", ") : "Chưa có trọ yêu thích.";
    const bookingText = bookings.length ? bookings.map(b=>`• ${b.boardingHouseId?.name || "?"} – ${b.roomId?.roomNumber || "?"} (${b.contractStatus || b.status})`).join("<br>") : "Chưa có booking.";
    const myReviewsText = myReviews.length ? myReviews.map(r=>`${r.boardingHouseId?.name}: ${r.rating}/5 – ${r.comment}`).join("<br>") : "Bạn chưa có đánh giá nào.";
    const topHousesHTML = topHouses.length ? topHouses.map((h,i)=>`#${i+1}. <b>${h.name}</b> – ${h.location.district} (⭐ ${h.avgRating}/5, ${h.availableRooms} phòng trống)`).join("<br>") : "Chưa có trọ nào có review.";
    const cheapestText = cheapestRoom ? `Phòng rẻ nhất: <b>${cheapestRoom.houseName}</b> – Phòng ${cheapestRoom.roomNumber} – Giá: ${cheapestRoom.price} VND – ${cheapestRoom.houseLocation.district}` : "Hiện tại chưa có phòng trống.";

    const customerCases = [
      { keywords: ["giá rẻ","rẻ nhất"], content: cheapestText },
      { keywords: ["top trọ","tốt nhất","đánh giá cao"], content: topHousesHTML },
      { keywords: ["booking","trạng thái"], content: bookingText },
      { keywords: ["review tôi","đánh giá tôi"], content: myReviewsText },
      { keywords: ["trọ yêu thích"], content: favoriteText },
      { keywords: ["membership","gói thành viên"], content: user.membership || "Bạn chưa có gói thành viên." }
    ];

    const matched = customerCases.find(c=>c.keywords.some(k=>lowerMsg.includes(k)));
    const answer = matched ? matched.content : `${cheapestText}<br>${topHousesHTML}`;

    promptContext = `
<b>Khách thuê:</b> ${user.name}<br>
Câu hỏi: "${message}"<br>

🎯 Trả lời:
${answer}
    `;
  }

  // ============================ ROLE: OWNER ============================
  else if (role === "owner") {
    const membership = await MemberShip.findOne({ ownerId: user.id }).populate("packageId").lean();
    const houses = await BoardingHouse.find({ ownerId: user.id }).lean();
    const houseIds = houses.map(h=>h._id);
    const bookings = await Booking.find({ boardingHouseId: {$in: houseIds} }).populate("roomId").lean();
    const reviews = await Review.find({ boardingHouseId: {$in: houseIds} }).lean();
    const rooms = await Room.find({ boardingHouseId: {$in: houseIds} }).lean();
    const recentReports = await Report.find({ boardingHouseId: {$in: houseIds} }).limit(3).lean();

    const activeBookings = bookings.filter(b=>b.contractStatus==="approved").length;
    const avgRating = reviews.length ? (reviews.reduce((sum,r)=>sum+r.rating,0)/reviews.length).toFixed(1) : "Chưa có review";
    const revenue = bookings.filter(b=>b.contractStatus==="approved").reduce((sum,b)=>(sum+b.roomId?.price||0),0);
    const lowRatingReviews = reviews.filter(r=>r.rating<3);

   const houseList = houses.map((h,i)=>{
    const houseRooms = rooms.filter(r=>r.boardingHouseId.toString()===h._id.toString());
    const available = houseRooms.filter(r=>r.status==='Available').length;
    const booked = houseRooms.filter(r=>r.status==='Booked').length;
    return `#${i+1}. ${h.name} (${h.approvedStatus}) – ${h.location.district}, ${available} phòng trống, ${booked} đã đặt`;
  }).join("<br>");

    const ownerCases = [
      { keywords:["phòng trống"], content: houseList || "Không có trọ nào." },
      { keywords:["doanh thu","hiệu suất"], content: `Tổng doanh thu: ${revenue} VND, Booking đã duyệt: ${activeBookings}` },
      { keywords:["review thấp"], content: `${lowRatingReviews.length} review thấp (<3⭐)` },
      { keywords:["membership","gói"], content: membership ? `${membership.type} – ${membership.status}, kết thúc: ${new Date(membership.endDate).toLocaleDateString()}` : "Chưa có gói thành viên" },
      { keywords:["báo cáo","cảnh báo"], content: recentReports.length ? recentReports.map(r=>`• ${r.type}: ${r.content.substring(0,50)}... (${r.status})`).join("<br>") : "Không có báo cáo" }
    ];

    const matched = ownerCases.find(c=>c.keywords.some(k=>lowerMsg.includes(k)));
    const answer = matched ? matched.content : houseList || "Chưa có trọ nào.";

    promptContext = `
<b>Chủ trọ:</b> ${user.name}<br>
Câu hỏi: "${message}"<br>

🎯 Trả lời:
${answer}
    `;
  }

  // ============================ ROLE: ADMIN ============================
  else if (role === "admin") {
    const pendingHouses = await BoardingHouse.find({ approvedStatus: "pending" }).limit(5).lean();
    const recentReports = await Report.find({ status: "Pending" }).limit(5).lean();
    const totalUsers = await User.countDocuments();
    const totalHouses = await BoardingHouse.countDocuments();

    const usersByRole = await User.aggregate([{ $group: { _id:"$role", count: { $sum:1 } } }]);
    const housesByStatus = await BoardingHouse.aggregate([{ $group: { _id:"$approvedStatus", count:{ $sum:1 } } }]);

    const pendingText = pendingHouses.length ? pendingHouses.map(h=>`• ${h.name} – ${h.location.district}`).join("<br>") : "Không có bài đăng chờ duyệt.";
    const reportText = recentReports.length ? recentReports.map(r=>`• ${r.type}: ${r.content.substring(0,60)}...`).join("<br>") : "Không có báo cáo mới.";

    const adminCases = [
      { keywords:["bài đăng chờ duyệt"], content: pendingText },
      { keywords:["báo cáo","report"], content: reportText },
      { keywords:["tổng quan","statistic"], content: `Người dùng: ${totalUsers}, Nhà trọ: ${totalHouses}` },
      { keywords:["user","role"], content: usersByRole.map(u=>`${u._id}: ${u.count}`).join(", ") },
      { keywords:["nhà trọ","trọ"], content: housesByStatus.map(h=>`${h._id}: ${h.count}`).join(", ") }
    ];

    const matched = adminCases.find(c=>c.keywords.some(k=>lowerMsg.includes(k)));
    const answer = matched ? matched.content : `Người dùng: ${totalUsers}, Nhà trọ: ${totalHouses}`;

    promptContext = `
<b>Admin:</b> ${user.name}<br>
Câu hỏi: "${message}"<br>

🎯 Trả lời:
${answer}
    `;
  }

  return promptContext;
};
