// File: pages/api/mpesa/register-urls.js
// Register validation and confirmation URLs

export default async function handler(req, res) {
  try {
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/auth`
    );
    const { token } = await authResponse.json();

    const registerData = {
      ShortCode: process.env.MPESA_SHORTCODE,
      ResponseType: "Completed",
      ConfirmationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/confirmation`,
      ValidationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/validation`,
    };

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      }
    );

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
