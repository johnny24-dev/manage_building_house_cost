import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/stores/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import { NotificationProvider } from "@/stores/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quản lý Chi phí Xây nhà",
  description: "Hệ thống quản lý chi phí xây dựng nhà",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <NotificationProvider>{children}</NotificationProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
