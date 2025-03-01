import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider"; // Import the fixed provider
import ModeToggle from "@/components/theme/theme-toggle";

export const metadata: Metadata = {
  title: "Attendance Optimizer",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Now using the fixed client provider */}
          <nav className="flex justify-between items-center p-2">
            <h1 className="text-2xl font-bold">Attendance Optimizer</h1>
            <div className="flex space-x-4">
              <ModeToggle />
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
