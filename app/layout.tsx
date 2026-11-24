import type { Metadata } from "next";
import "./globals.css";
import "./quiz.css";

export const metadata: Metadata = {
  title: "Capacity Connect | Learning Intelligence",
  description: "Meteorology learning portal.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
