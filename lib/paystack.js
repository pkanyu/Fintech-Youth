// Paystack payment utilities

export const initializePayment = ({
  amount,
  email,
  phoneNumber,
  metadata,
  onSuccess,
  onClose,
}) => {
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: amount * 100, // Convert KES to cents (kobo)
    currency: "KES",
    channels: ["mobile_money"], // M-PESA only
    metadata: {
      phone_number: phoneNumber,
      ...metadata,
    },
    callback: function (response) {
      console.log("✅ Payment successful:", response);
      if (onSuccess) onSuccess(response);
    },
    onClose: function () {
      console.log("Payment cancelled");
      if (onClose) onClose();
    },
  });

  handler.openIframe();
};

export const verifyPayment = async (reference) => {
  try {
    const response = await fetch(`/api/paystack/verify?reference=${reference}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Verification error:", error);
    return null;
  }
};
