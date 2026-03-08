import './globals.css';

export const metadata = {
  title: 'AURA Studio — Multimodal Creative Director',
  description: 'Real-time AI agent that turns spoken ideas into complete mixed-media campaign packages.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
