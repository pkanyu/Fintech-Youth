// Handle M-Pesa payment confirmation and trigger AI roundup

export default async function handler(req, res) {
  console.log("\n🔔🔔🔔 REAL M-PESA WEBHOOK RECEIVED 🔔🔔🔔");
  console.log("Full request body:", JSON.stringify(req.body, null, 2));
  console.log("🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔🔔\n");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const confirmationData = req.body;

    // M-Pesa sends different formats - handle both
    const TransAmount =
      confirmationData.TransAmount || confirmationData.trans_amount;
    const MSISDN = confirmationData.MSISDN || confirmationData.msisdn;
    const TransID = confirmationData.TransID || confirmationData.trans_id;
    const FirstName =
      confirmationData.FirstName || confirmationData.first_name || "User";

    console.log("=== PARSED DATA ===");
    console.log(`Amount: ${TransAmount}`);
    console.log(`Phone: ${MSISDN}`);
    console.log(`Transaction ID: ${TransID}`);
    console.log(`Name: ${FirstName}`);

    if (!TransAmount || !MSISDN) {
      console.log("❌ Missing required fields!");
      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Accepted but missing data",
      });
    }

    const spentAmount = parseFloat(TransAmount);
    console.log(
      `\n💰 User ${FirstName} (${MSISDN}) spent KES ${spentAmount}\n`
    );

    // Step 1: Call AI to analyze and decide roundup
    console.log("🤖 Calling AI for analysis...");
    const aiResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/ai/analyze-roundup`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: spentAmount,
          transactionHistory: [],
        }),
      }
    );

    if (!aiResponse.ok) {
      throw new Error("AI analysis failed");
    }

    const aiDecision = await aiResponse.json();
    console.log("AI Decision:", aiDecision);
    console.log(
      `📊 Recommendation: Round to ${aiDecision.roundTo}, save KES ${aiDecision.saved}`
    );
    console.log(`💡 Reason: ${aiDecision.reason}\n`);

    // Step 2: Save to Supabase Database
    console.log("💾 Saving to database...");
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data: transaction, error: dbError } = await supabase
        .from("transactions")
        .insert({
          phone_number: MSISDN,
          amount_spent: spentAmount,
          amount_saved: aiDecision.saved,
          rounded_to: aiDecision.roundTo,
          ai_reason: aiDecision.reason,
          status: "pending",
          mpesa_transaction_id: TransID,
        })
        .select()
        .single();

      if (dbError) {
        console.error("❌ Database error:", dbError);
      } else {
        console.log("✅ Transaction saved to database:", transaction.id);
      }
    } catch (dbError) {
      console.error("❌ Database connection error:", dbError);
    }

    // Step 3: Trigger STK Push for the savings amount
    if (aiDecision.saved > 0) {
      console.log(
        `📲 Sending STK Push for KES ${aiDecision.saved} to ${MSISDN}...`
      );

      const stkResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/stk-push`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phoneNumber: MSISDN,
            amount: aiDecision.saved,
          }),
        }
      );

      const stkResult = await stkResponse.json();
      console.log("STK Push Result:", stkResult);

      if (stkResult.ResponseCode === "0") {
        console.log("✅ Savings STK Push sent successfully!\n");

        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Transaction confirmed, savings request sent",
          aiDecision: aiDecision,
        });
      } else {
        console.log("❌ STK Push failed:", stkResult.errorMessage);
        res.status(200).json({
          ResultCode: 0,
          ResultDesc: "Transaction confirmed, but savings request failed",
        });
      }
    } else {
      console.log("ℹ️  No savings needed for this transaction\n");
      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Transaction confirmed, no savings needed",
      });
    }
  } catch (error) {
    console.error("❌ Error processing confirmation:", error);

    // Always return success to M-Pesa to avoid retries
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    });
  }
}
