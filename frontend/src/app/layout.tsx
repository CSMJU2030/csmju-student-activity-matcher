import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

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
        <html lang="th">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
