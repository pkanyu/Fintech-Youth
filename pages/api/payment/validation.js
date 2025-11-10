// Validate M-Pesa transaction before processing

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const validationData = req.body;
  console.log("M-Pesa Validation:", JSON.stringify(validationData, null, 2));

  const isValid = true; // Your validation logic here

  if (isValid) {
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  } else {
    res.status(200).json({
      ResultCode: 1,
      ResultDesc: "Rejected",
    });
  }
}
