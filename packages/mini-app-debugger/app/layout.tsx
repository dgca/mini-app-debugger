import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Sidebar/Sidebar";
import { NuqsAdapter } from "nuqs/adapters/next";
import "./globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body>
        <NuqsAdapter>
          <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 max-w-screen-2xl mx-auto">
              <SidebarTrigger />
              {children}
            </main>
          </SidebarProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
