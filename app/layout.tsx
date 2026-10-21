import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyOS — Your study space",
  description: "A calmer way to plan your study, learn with AI, and build consistent revision habits.",
  applicationName: "StudyOS",
};
export const viewport: Viewport = { themeColor: "#f7f8fc", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
