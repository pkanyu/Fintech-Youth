// Register validation and confirmation URLs

export default async function handler(req, res) {
  try {
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/auth`
    );
    const { token } = await authResponse.json();

    const registerData = {
      ShortCode: process.env.MPESA_SHORTCODE,
      ResponseType: "Completed",
      ConfirmationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/confirmation`,
      ValidationURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/validation`,
    };

    console.log("Registering URLs with M-Pesa...");
    console.log("Confirmation URL:", registerData.ConfirmationURL);
    console.log("Validation URL:", registerData.ValidationURL);

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
    console.log("Registration response:", data);
    res.status(200).json(data);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: error.message });
  }
}
