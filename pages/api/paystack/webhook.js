// Handle Paystack webhooks (payment confirmations)

import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify webhook signature
  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.log("❌ Invalid webhook signature");
    return res.status(400).json({ error: "Invalid signature" });
  }

  const event = req.body;

  console.log("\n🔔 Paystack Webhook Received:", event.event);

  try {
    if (event.event === "charge.success") {
      const { reference, amount, customer, metadata } = event.data;

      console.log("✅ Payment successful:");
      console.log(`- Reference: ${reference}`);
      console.log(`- Amount: KES ${amount / 100}`);
      console.log(`- Customer: ${customer.email}`);

      // Save to database
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      await supabase.from("transactions").insert({
        phone_number: metadata?.phone_number || customer.phone,
        amount_spent: metadata?.original_amount || 0,
        amount_saved: amount / 100,
        rounded_to: metadata?.rounded_to || 0,
        ai_reason: metadata?.ai_reason || "Savings via Paystack",
        status: "completed",
        mpesa_transaction_id: reference,
      });

      console.log("✅ Transaction saved to database\n");
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: error.message });
  }
}
