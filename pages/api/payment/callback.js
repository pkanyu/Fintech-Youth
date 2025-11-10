// Handle M-Pesa STK Push callbacks (savings confirmation)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const callbackData = req.body;
  console.log("=== STK Push Callback Received ===");
  console.log(JSON.stringify(callbackData, null, 2));

  const { Body } = callbackData;
  const { stkCallback } = Body;

  if (stkCallback.ResultCode === 0) {
    // Savings transaction successful!
    const items = stkCallback.CallbackMetadata.Item;
    const amount = items.find((item) => item.Name === "Amount")?.Value;
    const mpesaReceiptNumber = items.find(
      (item) => item.Name === "MpesaReceiptNumber"
    )?.Value;
    const phoneNumber = items.find(
      (item) => item.Name === "PhoneNumber"
    )?.Value;

    console.log("✅ SAVINGS SUCCESSFUL!");
    console.log({
      amount: `KES ${amount}`,
      receipt: mpesaReceiptNumber,
      phone: phoneNumber,
      time: new Date().toISOString(),
    });

    // In production:
    // 1. Update database - mark savings as completed
    // 2. Update user's total savings
    // 3. Send push notification: "Saved KES X! Total savings: KES Y"
    // 4. Update leaderboard/achievements
  } else {
    // Savings failed
    console.log("❌ Savings transaction failed:", stkCallback.ResultDesc);

    // In production:
    // 1. Mark as failed in database
    // 2. Maybe retry later
    // 3. Notify user
  }

  // Always return success to M-Pesa
  res.status(200).json({ ResultCode: 0, ResultDesc: "Accepted" });
}
