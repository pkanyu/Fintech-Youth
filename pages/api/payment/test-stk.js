// Test STK Push directly

export default async function handler(req, res) {
  const { phoneNumber, amount } = req.query;

  if (!phoneNumber || !amount) {
    return res.status(400).json({
      error: "Missing parameters. Use: ?phoneNumber=254XXXXXXXXX&amount=10",
    });
  }

  try {
    // Get access token
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/auth`
    );
    const { token } = await authResponse.json();

    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, -3);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString(
      "base64"
    );

    const stkPushData = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: shortcode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/callback`,
      AccountReference: "HabaHabaSavings",
      TransactionDesc: "Test Roundup Savings",
    };

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPushData),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
