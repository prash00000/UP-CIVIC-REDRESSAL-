import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import HelplineBar from "@/components/HelplineBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "UP Civic Grievance Portal | उत्तर प्रदेश जनहित समाधान",
  description:
    "Find the right officer for your village or town in Uttar Pradesh, with verified phone numbers, escalation ladders, and ready-made legal letters.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text antialiased flex flex-col">
        <I18nProvider>
          <HelplineBar />
          <Header />
          <main className="flex-1 w-full max-w-content mx-auto px-4 py-6 md:py-10">
            {children}
          </main>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
