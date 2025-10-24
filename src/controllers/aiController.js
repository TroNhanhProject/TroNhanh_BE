const { chatWithAIStreaming } = require("../service/aiService");
const BoardingHouse = require("../models/BoardingHouse");
const Review = require("../models/Reviews");
const Room = require("../models/Room")
exports.chat = async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).send("Message is required");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");

  try {
    // 1️⃣ Tìm dữ liệu có liên quan
  const houses = await BoardingHouse.find({ approvedStatus: "approved" })
  .limit(5)
  .lean();

for (let house of houses) {
  const rooms = await Room.find({ boardingHouseId: house._id }).lean();
  house.rooms = rooms.map(r => ({
    roomNumber: r.roomNumber,
    price: r.price,
    area: r.area,
    status: r.status,
    amenities: r.amenities
  }));
}


    // Nếu không có dữ liệu
    if (!houses.length) {
      await chatWithAIStreaming(
        `Bạn là chatbot hỗ trợ tìm trọ. Người dùng hỏi: "${message}". 
        Nhưng hiện không có nhà trọ nào trong database. Hãy trả lời khéo léo.`,
        (chunk) => res.write(chunk)
      );
      return res.end();
    }

    // 2️⃣ Chuẩn bị context mô tả các nhà trọ
   const summary = houses
  .map((h, i) => {
    const roomList = h.rooms && h.rooms.length
      ? h.rooms.map(r => `Phòng ${r.roomNumber} - ${r.area}m² - ${r.price.toLocaleString()} VNĐ (${r.status})`).join("; ")
      : "Chưa có phòng nào được đăng";

    return `#${i + 1}: ${h.name} – ${h.location.street}, ${h.location.district}.
Tiện ích: ${h.amenities.join(", ") || "Không có thông tin"}.
Các phòng: ${roomList}.
Mô tả: ${h.description.slice(0, 150)}...`;
  })
  .join("\n\n");

    // 3️⃣ Gửi prompt đến Gemini
  const prompt = `
Bạn là AI tư vấn trọ thông minh. 
Dưới đây là dữ liệu thực tế từ MongoDB của tôi:

${summary}

Người dùng hỏi: "${message}"

🎯 Nhiệm vụ:
- Chọn và giới thiệu các nhà trọ phù hợp nhất.
- Trả lời bằng giọng thân thiện, tự nhiên bằng tiếng Việt.
- **Phải trả kết quả ở dạng HTML**, có chia phần rõ ràng như sau:
  - <div class="ai-response"> phần AI trả lời </div>
  - <div class="house-list"> danh sách nhà trọ, mỗi nhà là 1 <div class="house-item">...</div> </div>

💡 Gợi ý format:
<div class="ai-response">
  <p>Chào bạn! Mình là AI hỗ trợ tìm trọ thông minh 😄</p>
  <p>Dưới đây là vài nhà trọ phù hợp với tiêu chí của bạn:</p>
</div>

<div class="house-list">
  <div class="house-item">
    <strong>Nhà trọ Anh Bùi</strong> – Lê Trung Đình, Ngũ Hành Sơn, Đà Nẵng <br>
    <em>Tiện ích:</em> Wi-Fi, điều hòa, máy giặt <br>
    <em>Mô tả:</em> Phòng rộng, thoáng, gần biển...
  </div>
</div>

Nếu không có kết quả phù hợp, hãy gợi ý người dùng điều chỉnh tiêu chí tìm kiếm.
`;


    await chatWithAIStreaming(prompt, (chunk) => res.write(chunk));
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Lỗi server AI");
  }
};
