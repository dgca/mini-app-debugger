import { Network, SquareChevronRight, FileText } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Logs",
    value: "logs",
    icon: SquareChevronRight,
  },
  {
    title: "Network",
    value: "network",
    icon: Network,
  },
  {
    title: "Manifest",
    value: "manifest",
    icon: FileText,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <h1 className="text-lg font-bold p-4">Mini App Debugger</h1>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={`?tab=${item.value}`}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
