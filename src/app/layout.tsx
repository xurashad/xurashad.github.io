import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rashad Hamidi",
    template: "%s | Rashad Hamidi",
  },
  description:
    "Personal website and research portfolio of Rashad Hamidi — PhD researcher in Mathematical and Theoretical Physics at Durham University, specialising in integrable sigma models, string theory, and supersymmetry. From Palestine.",
  keywords: [
    "Rashad Hamidi",
    "integrable models",
    "string theory",
    "supersymmetry",
    "Durham University",
    "theoretical physics",
    "Palestine",
    "Yang-Baxter",
    "sigma models",
  ],
  authors: [{ name: "Rashad Hamidi", url: "https://xurashad.github.io/" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://xurashad.github.io/",
    title: "Rashad Hamidi",
    description:
      "PhD researcher at Durham University specialising in integrable sigma models, string theory, and supersymmetry. From Birzeit, Palestine.",
    siteName: "Rashad Hamidi",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rashad Hamidi",
    description: "Integrable models, string theory, supersymmetry. From Palestine.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 pt-20">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
