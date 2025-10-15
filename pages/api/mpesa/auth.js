// File: pages/api/mpesa/auth.js
// M-Pesa OAuth Authentication

export default async function handler(req, res) {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
    "base64"
  );

  try {
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();
    res.status(200).json({ token: data.access_token });
  } catch (error) {
    res.status(500).json({ error: "Failed to authenticate" });
  }
}
