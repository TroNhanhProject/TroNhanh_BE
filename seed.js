import { MongoClient } from "mongodb";
const uri = "mongodb://127.0.0.1:27017"
const client = new MongoClient(uri);

export const propertySampleData = [
  {
    title: "Phòng trọ tiện nghi trung tâm Hải Châu",
    description: "Phòng trọ gần cầu Rồng, có nội thất cơ bản và bãi đậu xe.",
    price: 2500000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room0.png"],
    location: {
      district: "Hải Châu",
      street: "Lê Duẩn",
      addressDetail: "Số 12, Lê Duẩn",
      latitude: 16.074,
      longitude: 108.223,
    },
    roomDetails: "1 phòng ngủ | 1 nhà vệ sinh | WiFi | Máy lạnh | Gần chợ",
    available: "10 Jul 2025",
  },
  {
    title: "Phòng studio gần biển Mỹ Khê",
    description: "Studio đẹp, cách biển chỉ 300m, yên tĩnh và thoáng mát.",
    price: 3200000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room1.png"],
    location: {
      district: "Sơn Trà",
      street: "Nguyễn Văn Thoại",
      addressDetail: "Studio A3, Nguyễn Văn Thoại",
      latitude: 16.062,
      longitude: 108.247,
    },
    roomDetails: "Studio | 1 phòng tắm | WiFi | Máy giặt | Ban công",
    available: "15 Jul 2025",
  },
  {
    title: "Căn hộ mini Ngũ Hành Sơn",
    description: "Đầy đủ nội thất, gần Lotte Mart và biển Non Nước.",
    price: 4000000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room2.png"],
    location: {
      district: "Ngũ Hành Sơn",
      street: "Trần Đại Nghĩa",
      addressDetail: "Căn hộ 2B, số 30 Trần Đại Nghĩa",
      latitude: 16.005,
      longitude: 108.260,
    },
    roomDetails: "1 phòng ngủ | 1 nhà tắm | Bếp | Máy lạnh | WiFi",
    available: "20 Jul 2025",
  },
  {
    title: "Phòng trọ giá rẻ Liên Chiểu",
    description: "Gần ĐH Bách Khoa, phù hợp sinh viên, an ninh tốt.",
    price: 1800000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room3.png"],
    location: {
      district: "Liên Chiểu",
      street: "Nguyễn Lương Bằng",
      addressDetail: "Phòng A4, 213 Nguyễn Lương Bằng",
      latitude: 16.080,
      longitude: 108.146,
    },
    roomDetails: "1 phòng ngủ | Nhà vệ sinh chung | WiFi | Gần trường",
    available: "05 Aug 2025",
  },
  {
    title: "Căn hộ 2 phòng ngủ ở Cẩm Lệ",
    description: "Rộng rãi, có ban công và sân thượng, thích hợp gia đình nhỏ.",
    price: 4500000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room1.png"],
    location: {
      district: "Cẩm Lệ",
      street: "Phạm Như Xương",
      addressDetail: "Căn hộ 4A, Phạm Như Xương",
      latitude: 16.014,
      longitude: 108.194,
    },
    roomDetails: "2 phòng ngủ | 1 nhà tắm | Bếp | Máy lạnh | Bãi xe",
    available: "01 Aug 2025",
  },
  {
    title: "Studio gần cầu Trần Thị Lý",
    description: "Phòng yên tĩnh, đầy đủ nội thất, tiện đi làm.",
    price: 3700000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room0.png"],
    location: {
      district: "Hải Châu",
      street: "2 Tháng 9",
      addressDetail: "Số 89, đường 2/9",
      latitude: 16.043,
      longitude: 108.218,
    },
    roomDetails: "Studio | 1 phòng tắm | Bếp nhỏ | Máy giặt | Gần siêu thị",
    available: "10 Aug 2025",
  },
  {
    title: "Phòng trọ yên tĩnh Thanh Khê",
    description: "Gần ga Đà Nẵng, khu dân cư yên tĩnh, thoáng mát.",
    price: 2900000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room3.png"],
    location: {
      district: "Thanh Khê",
      street: "Lý Thái Tổ",
      addressDetail: "Phòng 6B, Lý Thái Tổ",
      latitude: 16.061,
      longitude: 108.195,
    },
    roomDetails: "1 phòng ngủ | 1 nhà vệ sinh | Gác lửng | Máy lạnh | WiFi",
    available: "12 Jul 2025",
  },
  {
    title: "Căn hộ gần bờ sông Hàn",
    description: "View sông, gần Vincom, thuận tiện di chuyển nội thành.",
    price: 5000000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room2.png"],
    location: {
      district: "Sơn Trà",
      street: "Bạch Đằng",
      addressDetail: "Căn hộ 5C, số 200 Bạch Đằng",
      latitude: 16.078,
      longitude: 108.225,
    },
    roomDetails: "2 phòng ngủ | 2 nhà tắm | Ban công | Máy lạnh | View đẹp",
    available: "25 Jul 2025",
  },
  {
    title: "Phòng trọ sinh viên đường Núi Thành",
    description: "Giá rẻ, có chỗ nấu ăn, phù hợp sinh viên nhóm 2 người.",
    price: 2200000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room1.png"],
    location: {
      district: "Hải Châu",
      street: "Núi Thành",
      addressDetail: "Phòng 2A, số 88 Núi Thành",
      latitude: 16.038,
      longitude: 108.218,
    },
    roomDetails: "1 phòng | Bếp nhỏ | Quạt | Toilet riêng | Gần ĐH Kiến Trúc",
    available: "08 Aug 2025",
  },
  {
    title: "Căn hộ cao cấp đường Trần Hưng Đạo",
    description: "Thiết kế sang trọng, gần cầu Rồng, full nội thất cao cấp.",
    price: 6000000,
    status: "available",
    isApproved: true,
    approvedStatus: "approved",
    photos: ["/photoss/Accommodation/room0.png"],
    location: {
      district: "Sơn Trà",
      street: "Trần Hưng Đạo",
      addressDetail: "Penthouse 10F, số 5 Trần Hưng Đạo",
      latitude: 16.065,
      longitude: 108.231,
    },
    roomDetails: "3 phòng ngủ | 2 nhà tắm | Thang máy | Ban công | View cầu Rồng",
    available: "30 Jul 2025",
  },
];



async function run() {
  try {
    await client.connect();
    const db = client.db("tro_nhanh"); // ví dụ: "rentaldb"
    const collection = db.collection("accommodations");

    // Thêm dữ liệu mới
    await collection.insertMany(propertySampleData);
    console.log("✅ Data inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting data:", err);
  } finally {
    await client.close();
  }
}

run();