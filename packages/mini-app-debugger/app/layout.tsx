import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import "./globals.css";
import { AppSidebar } from "@/components/Sidebar/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1">
            <SidebarTrigger />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
