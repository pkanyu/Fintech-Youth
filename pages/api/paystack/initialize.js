// Initialize Paystack payment (server-side)
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, email, phoneNumber, metadata } = req.body;

  if (!amount || !email) {
    return res.status(400).json({ error: "Amount and email required" });
  }

  try {
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amount * 100, // Convert to kobo
          currency: "KES",
          channels: ["mobile_money", "card"],
          metadata: {
            phone_number: phoneNumber,
            ...metadata,
          },
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}?payment=success`,
        }),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Payment initialization error:", error);
    res.status(500).json({ error: error.message });
  }
}
