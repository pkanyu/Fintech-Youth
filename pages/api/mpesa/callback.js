// File: pages/api/mpesa/callback.js
// Handle M-Pesa transaction callbacks

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const callbackData = req.body;
  console.log("M-Pesa Callback:", JSON.stringify(callbackData, null, 2));

  // Extract transaction details
  const { Body } = callbackData;
  const { stkCallback } = Body;

  if (stkCallback.ResultCode === 0) {
    // Transaction successful
    const items = stkCallback.CallbackMetadata.Item;
    const amount = items.find((item) => item.Name === "Amount")?.Value;
    const mpesaReceiptNumber = items.find(
      (item) => item.Name === "MpesaReceiptNumber"
    )?.Value;
    const phoneNumber = items.find(
      (item) => item.Name === "PhoneNumber"
    )?.Value;

    // Here you would:
    // 1. Save transaction to database
    // 2. Calculate roundup with AI
    // 3. Update user's savings balance

    console.log("Transaction Success:", {
      amount,
      mpesaReceiptNumber,
      phoneNumber,
    });
  } else {
    // Transaction failed
    console.log("Transaction Failed:", stkCallback.ResultDesc);
  }

  // Always return success to M-Pesa
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
}
