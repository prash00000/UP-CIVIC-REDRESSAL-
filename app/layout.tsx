import "./layers.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Theme } from "@astryxdesign/core/theme";
import { nlClassicTheme } from "../themes/nl-classic/nl-classic";
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
    <html lang="en" data-theme="light">
      <body className="min-h-screen bg-bg text-text antialiased flex flex-col">
        <Theme theme={nlClassicTheme} mode="light">
          <I18nProvider>
            <HelplineBar />
            <Header />
            <main className="flex-1 w-full max-w-[1120px] mx-auto px-4 sm:px-6 py-8 md:py-12">
              {children}
            </main>
            <Footer />
          </I18nProvider>
        </Theme>
      </body>
    </html>
  );
}
