import "./globals.css";

export const metadata = {
  title: "Toppi Seat Yield Demo",
  description: "Frontend-only feature prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-text">{children}</body>
    </html>
  );
}
