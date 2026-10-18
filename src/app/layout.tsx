import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Turn an overdue invoice into three ready-to-send follow-ups: Polite, Firm and Final notice. Free, open-source AI, no sign-up.";

export const metadata: Metadata = {
  metadataBase: new URL("https://chaselocal.vercel.app"),
  title: "ChaseLocal · Follow-up emails for overdue invoices",
  description,
  openGraph: {
    type: "website",
    siteName: "ChaseLocal",
    title: "ChaseLocal · Chase the invoice, not the client",
    description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChaseLocal · Chase the invoice, not the client",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf9f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0e" },
  ],
};

const themeScript = `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
