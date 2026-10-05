import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

// Thai glyphs first (ui-design-system.md 4.1); self-hosted by next/font.
const notoSansThai = Noto_Sans_Thai({
    variable: "--font-noto-thai",
    subsets: ["latin", "thai"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Interest Match - Find Your People",
    description: "ระบบค้นหาเพื่อนที่มีความสนใจคล้ายกัน สำหรับนักศึกษามหาวิทยาลัย",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="th" className={notoSansThai.variable}>
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
