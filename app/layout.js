import "./globals.css";

export const metadata = {
  title: "Haba Haba Savings",
  description: "AI-Powered M-Pesa Micro-Roundup Savings",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
