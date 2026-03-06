import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OneAccord - Guided Conversations for Couples',
  description: 'Build deeper connection through guided conversations across 10 core relationship topics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
