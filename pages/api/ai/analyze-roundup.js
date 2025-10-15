// File: pages/api/ai/analyze-roundup.js
// Groq AI analysis for roundup decisions

import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { amount, transactionHistory } = req.body;

  try {
    // Calculate user spending patterns
    const avgTransaction =
      transactionHistory.length > 0
        ? transactionHistory.reduce((sum, t) => sum + t.amount, 0) /
          transactionHistory.length
        : amount;

    const totalSpent = transactionHistory.reduce((sum, t) => sum + t.amount, 0);
    const totalSaved = transactionHistory.reduce((sum, t) => sum + t.saved, 0);
    const savingsRate =
      totalSpent > 0 ? ((totalSaved / totalSpent) * 100).toFixed(2) : 0;

    // Create AI prompt
    const prompt = `You are a financial advisor AI helping Kenyan users save money through M-Pesa roundups.

User's Spending Profile:
- Current transaction: KES ${amount}
- Average transaction: KES ${avgTransaction.toFixed(0)}
- Total transactions: ${transactionHistory.length}
- Current savings rate: ${savingsRate}%
- Total saved so far: KES ${totalSaved}

Task: Recommend the optimal roundup amount for this KES ${amount} transaction.

Rules:
1. Roundup options: nearest 10, 50, or 100 KES
2. For amounts under 100: round to nearest 10
3. For amounts 100-500: round to nearest 50
4. For amounts over 500: round to nearest 100, but cap savings at 100 KES to avoid discouraging users
5. Consider user's spending capacity and current savings rate
6. If savings rate is low (<5%), be more aggressive
7. If transaction is unusual (much higher/lower than average), adjust accordingly

Respond in JSON format:
{
  "roundTo": <amount>,
  "saved": <amount>,
  "reason": "<brief explanation in 1-2 sentences>"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a financial advisor AI. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 200,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    const decision = JSON.parse(aiResponse);

    res.status(200).json(decision);
  } catch (error) {
    console.error("Groq AI Error:", error);

    // Fallback to rule-based system
    let roundTo, saved, reason;

    if (amount < 100) {
      roundTo = Math.ceil(amount / 10) * 10;
      saved = roundTo - amount;
      reason = "AI unavailable. Using basic rounding to nearest 10 KES.";
    } else if (amount < 500) {
      roundTo = Math.ceil(amount / 50) * 50;
      saved = roundTo - amount;
      reason = "AI unavailable. Using basic rounding to nearest 50 KES.";
    } else {
      roundTo = Math.ceil(amount / 100) * 100;
      saved = Math.min(roundTo - amount, 100);
      roundTo = amount + saved;
      reason = "AI unavailable. Using basic rounding with 100 KES cap.";
    }

    res.status(200).json({ roundTo, saved, reason });
  }
}
