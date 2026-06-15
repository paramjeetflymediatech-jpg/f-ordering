import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AppLayoutWrapper from "@/components/layout/AppLayoutWrapper";

export const metadata: Metadata = {
  title: "Restaurant Management POS & Online Ordering SaaS Platform",
  description: "Cloud-based restaurant point of sale, online ordering, QR tables, and KDS integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppLayoutWrapper>{children}</AppLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
