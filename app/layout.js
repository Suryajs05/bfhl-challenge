import "./globals.css";

export const metadata = {
  title: "BFHL Graph Processor",
  description: "SRM Full Stack Engineering Challenge — Round 1",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}