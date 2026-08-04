import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "../../components/dashboard/app-sidebar";
import { Topbar } from "../../components/dashboard/topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider className="h-screen overflow-hidden">
      <AppSidebar />
      <SidebarInset className="h-screen overflow-hidden">
        <Topbar
          userName="Jean Dupont"
          userEmail="jean.dupont@fixbug.io"
          userRole="Chef de projet"
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
