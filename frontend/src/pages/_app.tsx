import "../styles/globals.css";
import type { AppProps } from "next/app";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider>
      <Header />
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
