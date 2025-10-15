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
  Settings,
  Zap,
} from "lucide-react";

const MpesaRoundupApp = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [aiInsight, setAiInsight] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    autoSave: true,
    aiEnabled: true,
  });

  // Simulate initial transactions
  useEffect(() => {
    const initialTransactions = [
      {
        id: 1,
        amount: 233,
        roundedTo: 250,
        saved: 17,
        date: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
        aiReason: "Low spending detected, conservative roundup",
      },
      {
        id: 2,
        amount: 450,
        roundedTo: 500,
        saved: 50,
        date: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
        aiReason: "Medium transaction, moderate savings",
      },
      {
        id: 3,
        amount: 89,
        roundedTo: 100,
        saved: 11,
        date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        aiReason: "Small purchase, minimal roundup",
      },
      {
        id: 4,
        amount: 1250,
        roundedTo: 1300,
        saved: 50,
        date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        aiReason: "Large transaction, capped savings",
      },
      {
        id: 5,
        amount: 175,
        roundedTo: 200,
        saved: 25,
        date: new Date(Date.now() - 3600000 * 24).toISOString(),
        aiReason: "Regular spending pattern detected",
      },
    ];
    setTransactions(initialTransactions);
    setTotalSaved(initialTransactions.reduce((sum, t) => sum + t.saved, 0));
  }, []);

  // Simulate AI decision making with Groq
  const getAIRoundup = async (amount) => {
    if (!settings.aiEnabled) {
      // Simple fixed roundup without AI
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

    // Simulate AI analysis (in real app, this calls Groq API)
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

    // AI Logic: Adaptive rounding based on spending patterns
    if (amount < 100) {
      roundTo = Math.ceil(amount / 10) * 10;
      saved = roundTo - amount;
      reason = `Small purchase (${
        amount < avgTransaction ? "below" : "at"
      } your average). Conservative roundup to maintain momentum.`;
    } else if (amount < 500) {
      if (avgTransaction > 300 && savingsRate < 5) {
        // User can afford more aggressive savings
        roundTo = Math.ceil(amount / 50) * 50;
        saved = roundTo - amount;
        reason = `Your spending capacity is high but savings rate is ${savingsRate}%. Moderate roundup recommended.`;
      } else {
        roundTo = Math.ceil(amount / 50) * 50;
        saved = roundTo - amount;
        reason = `Mid-range transaction. Balanced roundup to nearest 50 KES.`;
      }
    } else {
      // Large transactions - cap savings to avoid discouragement
      roundTo = Math.ceil(amount / 100) * 100;
      saved = Math.min(roundTo - amount, 100); // Cap at 100 KES
      roundTo = amount + saved;
      reason = `Large purchase detected. Capped savings at ${saved} KES to maintain affordability.`;
    }

    return { roundTo, saved, reason };
  };

  const handleTransaction = async (amount) => {
    setIsProcessing(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const aiDecision = await getAIRoundup(amount);

    const newTransaction = {
      id: transactions.length + 1,
      amount,
      roundedTo: aiDecision.roundTo,
      saved: aiDecision.saved,
      date: new Date().toISOString(),
      aiReason: aiDecision.reason,
    };

    setTransactions([newTransaction, ...transactions]);
    setTotalSaved((prev) => prev + aiDecision.saved);
    setAiInsight(aiDecision.reason);
    setIsProcessing(false);
  };

  const quickTransactions = [150, 233, 450, 89, 1200, 675];

  // Chart data
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
                <p className="text-gray-500">AI-Powered M-Pesa Roundup</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  demoMode
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {demoMode ? "🎮 Demo Mode" : "🔗 Live M-Pesa"}
              </span>
              <button
                onClick={() => setDemoMode(!demoMode)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Toggle Mode
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-100">Total Saved</span>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="text-3xl font-bold">KES {totalSaved}</div>
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
                  ? Math.round(totalSaved / transactions.length)
                  : 0}
              </div>
              <div className="text-gray-500 text-sm mt-1">per transaction</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Transaction Simulator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-800">
                  Simulate Transaction
                </h2>
              </div>

              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Click to simulate M-Pesa spending:
                </p>
                {quickTransactions.map((amount, i) => (
                  <button
                    key={i}
                    onClick={() => handleTransaction(amount)}
                    disabled={isProcessing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
                  >
                    Spend KES {amount}
                  </button>
                ))}
              </div>

              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent"></div>
                  <p className="text-sm text-gray-600 mt-2">AI analyzing...</p>
                </div>
              )}
            </div>

            {/* AI Insight */}
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
                      KES {totalSaved}
                    </p>
                    <p className="text-sm text-gray-500">Goal: KES 500</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Recent Transactions
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No transactions yet. Start saving!
                  </p>
                ) : (
                  transactions.map((t) => (
                    <div
                      key={t.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-800">
                            KES {t.amount} → KES {t.roundedTo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(t.date).toLocaleDateString()} at{" "}
                            {new Date(t.date).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-600 font-bold">
                            +{t.saved} KES
                          </div>
                          <div className="text-xs text-gray-500">saved</div>
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
            <strong>Demo Mode:</strong> Simulating M-Pesa transactions. Real
            integration ready with Daraja API.
            <br />
            <strong>AI Powered by Groq:</strong> Learns your spending habits to
            optimize savings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MpesaRoundupApp;
