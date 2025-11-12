"use client";

import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Wallet,
  TrendingUp,
  Brain,
  ArrowUpRight,
  Zap,
  RefreshCw,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Script from "next/script";

const MpesaRoundupApp = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingReal, setIsLoadingReal] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    aiEnabled: true,
  });

  // Load Paystack script - Fixed version
  useEffect(() => {
    // Check if Paystack is already loaded
    if (window.PaystackPop) {
      console.log("✅ Paystack already loaded");
      setPaystackLoaded(true);
      return;
    }

    // Wait for script tag to load
    const checkPaystack = setInterval(() => {
      if (window.PaystackPop) {
        console.log("✅ Paystack loaded");
        setPaystackLoaded(true);
        clearInterval(checkPaystack);
      }
    }, 100);

    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkPaystack);
      if (!window.PaystackPop) {
        console.error("❌ Paystack failed to load");
      }
    }, 10000);

    return () => {
      clearInterval(checkPaystack);
      clearTimeout(timeout);
    };
  }, []);

  // Load transactions based on mode
  useEffect(() => {
    if (!demoMode) {
      loadRealTransactions();
      subscribeToRealTime();
    } else {
      loadDemoTransactions();
    }
  }, [demoMode]);

  const loadRealTransactions = async () => {
    setIsLoadingReal(true);
    console.log("📊 Loading real transactions from Supabase...");

    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error loading transactions:", error);
        setAiInsight("Failed to load transactions. Check database connection.");
        return;
      }

      console.log(`✅ Loaded ${data.length} real transactions`);

      const formatted = data.map(formatTransaction);
      setTransactions(formatted);

      const total = data.reduce(
        (sum, t) => sum + parseFloat(t.amount_saved || 0),
        0
      );
      setTotalSaved(total);

      if (data.length > 0) {
        setAiInsight(
          `Loaded ${
            data.length
          } real transactions. Total saved: KES ${total.toFixed(2)}`
        );
      } else {
        setAiInsight("No transactions yet. Click a button to save!");
      }
    } catch (err) {
      console.error("Database error:", err);
      setAiInsight("Database connection error. Check your .env.local");
    } finally {
      setIsLoadingReal(false);
    }
  };

  const subscribeToRealTime = () => {
    console.log("🔴 Subscribing to real-time updates...");

    const subscription = supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
        },
        (payload) => {
          console.log("🔔 New transaction received!", payload.new);
          const newTransaction = formatTransaction(payload.new);
          setTransactions((prev) => [newTransaction, ...prev]);
          setTotalSaved((prev) => prev + parseFloat(payload.new.amount_saved));
          setAiInsight(
            `New transaction: Saved KES ${payload.new.amount_saved}!`
          );
        }
      )
      .subscribe();

    return () => {
      console.log("Unsubscribing from real-time updates");
      subscription.unsubscribe();
    };
  };

  const formatTransaction = (dbTransaction) => ({
    id: dbTransaction.id,
    amount: parseFloat(dbTransaction.amount_spent),
    roundedTo: parseFloat(dbTransaction.rounded_to),
    saved: parseFloat(dbTransaction.amount_saved),
    date: dbTransaction.created_at,
    aiReason: dbTransaction.ai_reason,
    status: dbTransaction.status,
  });

  const loadDemoTransactions = () => {
    const initialTransactions = [
      {
        id: 1,
        amount: 233,
        roundedTo: 250,
        saved: 17,
        date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        aiReason: "Low spending detected, conservative roundup",
        status: "completed",
      },
      {
        id: 2,
        amount: 450,
        roundedTo: 500,
        saved: 50,
        date: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        aiReason: "Medium transaction, moderate savings",
        status: "completed",
      },
      {
        id: 3,
        amount: 89,
        roundedTo: 100,
        saved: 11,
        date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        aiReason: "Small purchase, minimal roundup",
        status: "completed",
      },
      {
        id: 4,
        amount: 1250,
        roundedTo: 1300,
        saved: 50,
        date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        aiReason: "Large transaction, capped savings",
        status: "completed",
      },
      {
        id: 5,
        amount: 175,
        roundedTo: 200,
        saved: 25,
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        aiReason: "Regular spending pattern detected",
        status: "completed",
      },
    ];
    setTransactions(initialTransactions);
    setTotalSaved(initialTransactions.reduce((sum, t) => sum + t.saved, 0));
  };

  const getAIRoundup = async (amount) => {
    if (!settings.aiEnabled) {
      if (amount < 100)
        return {
          roundTo: Math.ceil(amount / 10) * 10,
          saved: Math.ceil(amount / 10) * 10 - amount,
          reason: "AI disabled - basic rounding to nearest 10",
        };
      if (amount < 500)
        return {
          roundTo: Math.ceil(amount / 50) * 50,
          saved: Math.ceil(amount / 50) * 50 - amount,
          reason: "AI disabled - basic rounding to nearest 50",
        };
      return {
        roundTo: Math.ceil(amount / 100) * 100,
        saved: Math.ceil(amount / 100) * 100 - amount,
        reason: "AI disabled - basic rounding to nearest 100",
      };
    }

    const avgTransaction =
      transactions.length > 0
        ? transactions.reduce((sum, t) => sum + t.amount, 0) /
          transactions.length
        : amount;

    const savingsRate =
      transactions.length > 0
        ? (
            (totalSaved / transactions.reduce((sum, t) => sum + t.amount, 0)) *
            100
          ).toFixed(1)
        : 0;

    let roundTo, saved, reason;

    if (amount < 100) {
      roundTo = Math.ceil(amount / 10) * 10;
      saved = roundTo - amount;
      reason = `Small purchase (${
        amount < avgTransaction ? "below" : "at"
      } your average). Conservative roundup to maintain momentum.`;
    } else if (amount < 500) {
      if (avgTransaction > 300 && savingsRate < 5) {
        roundTo = Math.ceil(amount / 50) * 50;
        saved = roundTo - amount;
        reason = `Your spending capacity is high but savings rate is ${savingsRate}%. Moderate roundup recommended.`;
      } else {
        roundTo = Math.ceil(amount / 50) * 50;
        saved = roundTo - amount;
        reason = `Mid-range transaction. Balanced roundup to nearest 50 KES.`;
      }
    } else {
      roundTo = Math.ceil(amount / 100) * 100;
      saved = Math.min(roundTo - amount, 100);
      roundTo = amount + saved;
      reason = `Large purchase detected. Capped savings at ${saved} KES to maintain affordability.`;
    }

    return { roundTo, saved, reason };
  };

  // Handle transaction with Paystack - Using API initialization instead of inline
  const handleTransactionWithPaystack = async (amount) => {
    setIsProcessing(true);

    try {
      // Get AI decision
      const aiDecision = await getAIRoundup(amount);
      setAiInsight(
        `AI recommends saving KES ${aiDecision.saved}. Initializing payment...`
      );

      // Check if amount is valid before proceeding
      if (!aiDecision.saved || aiDecision.saved <= 0) {
        console.error("Invalid savings amount:", aiDecision.saved);
        setAiInsight(
          "AI calculated no savings for this transaction. Amount already rounded!"
        );
        setIsProcessing(false);
        return;
      }

      console.log("💰 Payment details:", {
        originalAmount: amount,
        roundedTo: aiDecision.roundTo,
        saved: aiDecision.saved,
        paystackAmount: Number(aiDecision.saved) * 100,
      });

      // Initialize payment via API (server-side)
      const response = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(aiDecision.saved),
          email: "user@habahaba.com",
          phoneNumber: "254745972459",
          metadata: {
            original_amount: amount,
            rounded_to: aiDecision.roundTo,
            ai_reason: aiDecision.reason,
            purpose: "Roundup Savings",
          },
        }),
      });

      const data = await response.json();

      if (data.status && data.data.authorization_url) {
        console.log("✅ Payment initialized:", data.data.reference);

        // Save pending transaction to Supabase
        const { error: dbError } = await supabase.from("transactions").insert({
          user_id: null,
          phone_number: "254745972459",
          amount_spent: Number(amount),
          amount_saved: Number(aiDecision.saved),
          rounded_to: Number(aiDecision.roundTo),
          ai_reason: aiDecision.reason,
          status: "pending",
          mpesa_transaction_id: data.data.reference,
        });

        if (dbError) {
          console.error("❌ Database error:", dbError);
        } else {
          console.log("✅ Pending transaction saved");
        }

        // Redirect to Paystack checkout
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setAiInsight(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  // Demo mode handler (simulation)
  const handleDemoTransaction = async (amount) => {
    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const aiDecision = await getAIRoundup(amount);

    const newTransaction = {
      id: transactions.length + 1,
      amount,
      roundedTo: aiDecision.roundTo,
      saved: aiDecision.saved,
      date: new Date().toISOString(),
      aiReason: aiDecision.reason,
      status: "completed",
    };

    setTransactions([newTransaction, ...transactions]);
    setTotalSaved((prev) => prev + aiDecision.saved);
    setAiInsight(aiDecision.reason);
    setIsProcessing(false);
  };

  const handleTransaction = (amount) => {
    if (demoMode) {
      handleDemoTransaction(amount);
    } else {
      handleTransactionWithPaystack(amount);
    }
  };

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawPhone) {
      alert("Please enter amount and phone number");
      return;
    }

    const amount = parseFloat(withdrawAmount);

    if (amount > totalSaved) {
      alert(`Insufficient balance. You have KES ${totalSaved.toFixed(2)}`);
      return;
    }

    if (amount < 10) {
      alert("Minimum withdrawal is KES 10");
      return;
    }

    setIsWithdrawing(true);

    try {
      const response = await fetch("/api/paystack/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: withdrawPhone,
          amount: amount,
          reason: "Haba Haba Savings Withdrawal",
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ KES ${amount} sent to ${withdrawPhone} successfully!`);
        setTotalSaved((prev) => prev - amount);
        setWithdrawAmount("");
        setWithdrawPhone("");
        setShowWithdraw(false);
        loadRealTransactions();
      } else {
        alert(`❌ Withdrawal failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const quickTransactions = [150, 233, 450, 89, 1200, 675];

  const chartData = transactions
    .slice(0, 10)
    .reverse()
    .map((t, i) => ({
      name: `T${i + 1}`,
      spent: t.amount,
      saved: t.saved,
    }));

  const savingsBreakdown = [
    { name: "Saved", value: totalSaved, color: "#10b981" },
    {
      name: "Potential",
      value: Math.max(500 - totalSaved, 0),
      color: "#e5e7eb",
    },
  ];

  return (
    <>
      {/* Paystack Script */}
      <Script
        src="https://js.paystack.co/v1/inline.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Paystack script loaded");
          setPaystackLoaded(true);
        }}
        onError={() => {
          console.error("Failed to load Paystack script");
        }}
      />

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl">
                  <Wallet className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">
                    Haba Haba Savings
                  </h1>
                  <p className="text-gray-500">
                    AI-Powered M-Pesa Roundup via Paystack
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                    demoMode
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {!demoMode && (
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                  {demoMode ? "🎮 Demo Mode" : "💳 Paystack Live"}
                </span>
                <button
                  onClick={() => setDemoMode(!demoMode)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Toggle Mode
                </button>
                {!demoMode && (
                  <>
                    <button
                      onClick={loadRealTransactions}
                      disabled={isLoadingReal}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isLoadingReal ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </button>
                    <button
                      onClick={() => setShowWithdraw(true)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Withdraw
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-green-100">Total Saved</span>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold">
                  KES {totalSaved.toFixed(2)}
                </div>
                <div className="text-green-100 text-sm mt-1">
                  {transactions.length} transactions
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Average Roundup</span>
                  <ArrowUpRight className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800">
                  KES{" "}
                  {transactions.length > 0
                    ? (totalSaved / transactions.length).toFixed(2)
                    : 0}
                </div>
                <div className="text-gray-500 text-sm mt-1">
                  per transaction
                </div>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">AI Status</span>
                  <Brain className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-xl font-bold text-gray-800">
                  {settings.aiEnabled ? "Active" : "Disabled"}
                </div>
                <button
                  onClick={() =>
                    setSettings({ ...settings, aiEnabled: !settings.aiEnabled })
                  }
                  className="text-purple-600 text-sm mt-1 hover:underline"
                >
                  {settings.aiEnabled ? "Disable" : "Enable"} AI
                </button>
              </div>
            </div>
          </div>

          {/* Withdrawal Modal */}
          {showWithdraw && !demoMode && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Withdraw Savings</h2>
                <p className="text-gray-600 mb-4">
                  Available balance:{" "}
                  <span className="font-bold text-green-600">
                    KES {totalSaved.toFixed(2)}
                  </span>
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number (M-PESA)
                    </label>
                    <input
                      type="tel"
                      placeholder="254700000000"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount (KES)
                    </label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum: KES 10
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowWithdraw(false)}
                      disabled={isWithdrawing}
                      className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all"
                    >
                      {isWithdrawing ? "Processing..." : "Withdraw"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Transaction Buttons */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-xl font-bold text-gray-800">
                    {demoMode ? "Simulate Transaction" : "Save Money"}
                  </h2>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {demoMode ? "Click to simulate spending:" : "I just spent:"}
                  </p>
                  {quickTransactions.map((amount, i) => (
                    <button
                      key={i}
                      onClick={() => handleTransaction(amount)}
                      disabled={isProcessing}
                      className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
                    >
                      {demoMode
                        ? `Spend KES ${amount}`
                        : `Save from KES ${amount}`}
                    </button>
                  ))}
                </div>

                {isProcessing && (
                  <div className="mt-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                    <p className="text-sm text-gray-600 mt-2">
                      {demoMode ? "AI analyzing..." : "Processing payment..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Paystack Info */}
              {!demoMode && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xl">💳</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 mb-2">
                        Powered by Paystack
                      </h3>
                      <p className="text-xs text-blue-700 mb-2">
                        Secure M-PESA payments
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>✓ Instant transactions</li>
                        <li>✓ Bank-level security</li>
                        <li>✓ Real-time confirmations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {aiInsight && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-purple-900 mb-2">
                        AI Insight
                      </h3>
                      <p className="text-sm text-purple-700">{aiInsight}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Analytics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Charts */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Savings Analytics
                </h2>

                {isLoadingReal ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-3">
                        Transaction History
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="spent"
                            stroke="#6366f1"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="saved"
                            stroke="#10b981"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-3">
                        Savings Progress
                      </h3>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={savingsBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {savingsBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <p className="text-2xl font-bold text-green-600">
                          KES {totalSaved.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">Goal: KES 500</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction List */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Transactions
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 mb-2">
                        {demoMode
                          ? "No transactions yet. Start saving!"
                          : "No transactions yet. Click a button to save!"}
                      </p>
                    </div>
                  ) : (
                    transactions.map((t) => (
                      <div
                        key={t.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-gray-800">
                              {t.amount > 0
                                ? `KES ${t.amount} → KES ${t.roundedTo}`
                                : "Withdrawal"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(t.date).toLocaleDateString()} at{" "}
                              {new Date(t.date).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold ${
                                t.saved >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {t.saved >= 0 ? "+" : ""}
                              {t.saved} KES
                            </div>
                            <div
                              className={`text-xs ${
                                t.status === "completed"
                                  ? "text-green-600"
                                  : "text-yellow-600"
                              }`}
                            >
                              {t.status}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-purple-600 bg-purple-50 rounded p-2 mt-2">
                          💡 {t.aiReason}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
            <p className="text-sm text-blue-800">
              {demoMode ? (
                <>
                  <strong>Demo Mode:</strong> Simulating transactions. Switch to
                  Paystack Live to save real money.
                </>
              ) : (
                <>
                  <strong>Paystack Live:</strong> Secure M-PESA payments.
                  Instant withdrawals available.
                </>
              )}
              <br />
              <strong>AI Powered by Groq:</strong> Learns your spending habits
              to optimize savings.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MpesaRoundupApp;
