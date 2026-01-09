import type { SidebarMenuData } from "@/config/menuStore";

export async function apiLoadMenu(): Promise<SidebarMenuData> {
    const res = await fetch("/api/menu");
    if (!res.ok) throw new Error("Load menu failed");
    return res.json();
}

export async function apiSaveMenu(data: SidebarMenuData): Promise<void> {
    const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Save menu failed");
}
