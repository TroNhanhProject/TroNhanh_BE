// TroNhanh_BE/src/controllers/vnpayController.js
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');
const vnpayConfig = require('../../config/vnpayConfig');
const url = require('url');
const Payment = require('../models/Payment');
const MembershipPackage = require('../models/MembershipPackage');


function sortAndBuildSignData(obj) {
    let keys = Object.keys(obj).sort();
    let signData = '';
    keys.forEach((key, index) => {
        let encodedValue = encodeURIComponent(obj[key]).replace(/%20/g, '+');
        signData += `${key}=${encodedValue}`;
        if (index < keys.length - 1) signData += '&';
    });
    return signData;
}

exports.createPaymentUrl = async (req, res) => {
    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (ipAddr === '::1') ipAddr = '127.0.0.1';

    const { vnp_TmnCode, vnp_HashSecret, vnp_Url, vnp_ReturnUrl } = vnpayConfig;
    const { amount, packageId, userId } = req.body;

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const orderId = moment(date).format('DDHHmmss');

    const orderInfoRaw = `packageId=${packageId}|userId=${userId}`;
    const orderInfo = Buffer.from(orderInfoRaw).toString('base64');

    const paramsForSign = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: 'other',
        vnp_Amount: amount * 100,
        vnp_ReturnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
    };

    const signData = sortAndBuildSignData(paramsForSign);
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const finalParams = {
        ...paramsForSign,
        vnp_SecureHash: secureHash,
    };

    const paymentUrl = `${vnp_Url}?${qs.stringify(finalParams, { encode: true })}`;

    // Debug
    console.log("✅ [Sorted keys]:", Object.keys(paramsForSign).sort());
    console.log("✅ [signData]:", signData);
    console.log("✅ [vnp_SecureHash]:", secureHash);
    console.log("✅ [Payment URL]:", paymentUrl);
    console.log("📦 packageId:", packageId);
    console.log("👤 userId:", userId);

    res.json({ url: paymentUrl });
};

exports.vnpayReturn = async (req, res) => {
    const vnp_HashSecret = vnpayConfig.vnp_HashSecret;

    const parsedUrl = url.parse(req.originalUrl, true);
    const query = parsedUrl.query;
    const secureHash = query.vnp_SecureHash;

    const inputData = { ...query };
    delete inputData.vnp_SecureHash;
    delete inputData.vnp_SecureHashType;

    const signData = sortAndBuildSignData(inputData);
    const hmac = crypto.createHmac('sha512', vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    let packageId = '';
    let userId = '';
    try {
        const orderInfoDecoded = Buffer.from(query.vnp_OrderInfo, 'base64').toString('utf-8');
        const [pkgPart, userPart] = orderInfoDecoded.split('|');
        packageId = pkgPart.split('=')[1];
        userId = userPart.split('=')[1];
    } catch (err) {
        console.error('❌ Lỗi giải mã orderInfo:', err);
    }

    console.log("📦 packageId:", packageId);
    console.log("👤 userId:", userId);

    if (secureHash === signed && query.vnp_ResponseCode === '00') {
        console.log("✅ Callback chữ ký HỢP LỆ");

        try {
            const membershipPackage = await MembershipPackage.findById(packageId);

            if (!membershipPackage) {
                console.error("❌ Không tìm thấy gói membership.");
            } else {
                await Payment.create({
                    ownerId: userId,
                    membershipPackageId: packageId,
                    vnpayTransactionId: query.vnp_TransactionNo || query.vnp_TxnRef,
                    title: `Thanh toán gói ${membershipPackage.packageName}`,
                    description: `Thanh toán gói ${membershipPackage.packageName} thành công qua VNPay`,
                    amount: membershipPackage.price,
                    status: 'Paid',
                    createAt: new Date(),
                });

                console.log("✅ Đã lưu thông tin thanh toán vào MongoDB.");
            }
        } catch (err) {
            console.error("❌ Lỗi khi lưu payment:", err);
        }

        return res.redirect(`http://localhost:3000/owner/membership-result?success=true&packageId=${packageId}`);
    } else {
        console.log("❌ Callback chữ ký SAI");
        return res.redirect('http://localhost:3000/owner/membership-result?success=false');
    }
};

