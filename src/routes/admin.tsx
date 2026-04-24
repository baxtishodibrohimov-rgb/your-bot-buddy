import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import * as React from "react";
import { useAuth } from "@/lib/auth";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  CalendarCheck,
  UserCog,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  Settings,
  Megaphone,
  Wrench,
  LogOut,
  Image as ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
type NavGroup = { group: string; items: NavItem[] };

const nav: NavGroup[] = [
  { group: "Asosiy", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  ]},
  { group: "Bemorlar", items: [
    { to: "/admin/patients", label: "Bemorlar", icon: Users },
    { to: "/admin/appointments", label: "Uchrashuvlar", icon: CalendarCheck },
    { to: "/admin/complaints", label: "Shikoyatlar", icon: MessageSquare },
  ]},
  { group: "Xodimlar", items: [
    { to: "/admin/staff", label: "Xodimlar", icon: UserCog },
    { to: "/admin/checklists", label: "Checklistlar", icon: ClipboardCheck },
  ]},
  { group: "Laboratoriya", items: [
    { to: "/admin/lab-orders", label: "Buyurtmalar", icon: FlaskConical },
    { to: "/admin/lab-workers", label: "Lab xodimlari", icon: Wrench },
  ]},
  { group: "Rezidentura", items: [
    { to: "/admin/residents", label: "Rezidentlar", icon: GraduationCap },
    { to: "/admin/resident-sections", label: "Bo'limlar va testlar", icon: ClipboardCheck },
  ]},
  { group: "Sozlamalar", items: [
    { to: "/admin/clinic", label: "Klinika", icon: Settings },
    { to: "/admin/services", label: "Xizmatlar", icon: ClipboardCheck },
    { to: "/admin/media", label: "Media", icon: ImageIcon },
    { to: "/admin/broadcasts", label: "Broadcast", icon: Megaphone },
    { to: "/admin/admins", label: "Adminlar", icon: UserCog },
  ]},
];

function AdminLayout() {
  const { session, isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!loading && (!session || !isAdmin)) {
      navigate({ to: "/auth" });
    }
  }, [loading, session, isAdmin, navigate]);

  if (loading || !session || !isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <div className="px-2 py-1 text-sm font-semibold">Biodent Admin</div>
          </SidebarHeader>
          <SidebarContent>
            {nav.map((g) => (
              <SidebarGroup key={g.group}>
                <SidebarGroupLabel>{g.group}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {g.items.map((item) => {
                      const isActive = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);
                      return (
                        <SidebarMenuItem key={item.to}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link to={item.to}>
                              <item.icon className="h-4 w-4" />
                              <span>{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter>
            <div className="px-2 pb-2 text-xs text-muted-foreground truncate">{user?.email}</div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center gap-2 border-b px-4 sticky top-0 bg-background z-10">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut className="h-4 w-4 mr-1" /> Chiqish
            </Button>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
