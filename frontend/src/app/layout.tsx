import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "FYNIX",
  description: "FYNIX - Tu gestor financiero personal",
  keywords: "finanzas, gestión financiera, presupuesto, ahorro",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
  <html lang="es" suppressHydrationWarning>
    <head>
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('tema')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
        }}
      />
    </head>
    <body>{children}</body>
  </html>
  );
}
