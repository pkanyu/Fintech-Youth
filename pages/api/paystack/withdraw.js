// Send money to user's M-PESA (Paystack Transfer)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phoneNumber, amount, userId, reason } = req.body;

  if (!phoneNumber || !amount) {
    return res.status(400).json({
      error: "Missing parameters",
      required: { phoneNumber: "254XXXXXXXXX", amount: "number" },
    });
  }

  try {
    // Format phone number - Remove 254 prefix if present
    let formattedPhone = phoneNumber;
    if (phoneNumber.startsWith("254")) {
      formattedPhone = "0" + phoneNumber.substring(3); // 254745972459 -> 0745972459
    }

    console.log(`💸 Processing withdrawal: KES ${amount} to ${phoneNumber}`);
    console.log(`📱 Formatted phone: ${formattedPhone}`);

    // Step 1: Create transfer recipient
    const recipientResponse = await fetch(
      "https://api.paystack.co/transferrecipient",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "mobile_money",
          name: "Haba Haba User",
          account_number: formattedPhone, // ✅ Use formatted phone
          bank_code: "MPESA",
          currency: "KES",
        }),
      }
    );

    const recipientData = await recipientResponse.json();

    if (!recipientData.status) {
      console.error("❌ Recipient error:", recipientData);
      throw new Error(recipientData.message || "Failed to create recipient");
    }

    console.log("✅ Recipient created:", recipientData.data.recipient_code);

    // Step 2: Initiate transfer
    const transferResponse = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100,
        recipient: recipientData.data.recipient_code,
        reason: reason || "Haba Haba Savings Withdrawal",
        currency: "KES",
      }),
    });

    const transferData = await transferResponse.json();

    if (transferData.status) {
      console.log("✅ Transfer initiated:", transferData.data);

      // Save to database
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      await supabase.from("transactions").insert({
        user_id: userId || null,
        phone_number: phoneNumber,
        amount_spent: 0,
        amount_saved: -amount,
        rounded_to: 0,
        ai_reason: reason || "Withdrawal",
        status: "completed",
        mpesa_transaction_id: transferData.data.reference,
      });

      res.status(200).json({
        success: true,
        reference: transferData.data.reference,
        message: "Money sent to M-PESA successfully!",
      });
    } else {
      console.error("❌ Transfer error:", transferData);
      throw new Error(transferData.message || "Transfer failed");
    }
  } catch (error) {
    console.error("❌ Withdrawal error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
