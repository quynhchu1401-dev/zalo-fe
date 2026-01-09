import { ref } from "vue";

export type MenuItem = {
  id: string;
  label: string;
  icon?: string;
  to?: string;
  isActive?: boolean;
  children?: MenuItem[];
};

export type SidebarMenuData = {
  version: number;
  admin: MenuItem[];
  user: MenuItem[];
};

const API = "/api/menu";
const VERSION = 3;

export const menuData = ref<SidebarMenuData>({
  version: VERSION,
  admin: [],
  user: [],
});

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const uid = (p: string) => `${p}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export async function loadMenu() {
  const res = await fetch(API);
  if (!res.ok) throw new Error("Load menu failed");
  const data = (await res.json()) as SidebarMenuData;

  // đảm bảo format
  menuData.value = {
    version: typeof data.version === "number" ? data.version : VERSION,
    admin: Array.isArray(data.admin) ? data.admin : [],
    user: Array.isArray(data.user) ? data.user : [],
  };
}

export async function saveMenu(next: SidebarMenuData) {
  const payload: SidebarMenuData = {
    version: next.version ?? VERSION,
    admin: next.admin ?? [],
    user: next.user ?? [],
  };

  const res = await fetch(API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Save menu failed: ${txt}`);
  }

  menuData.value = payload;
}

/** bấm “Lưu” */
export async function saveCurrent() {
  await saveMenu(clone(menuData.value));
}

/** CRUD (admin-only) */
export function addParent() {
  menuData.value.admin.push({
    id: uid("parent"),
    label: "Menu cha mới",
    icon: "pi pi-folder",
    isActive: true,
    children: [],
  });
}

export function addChild(parentId: string) {
  const p = menuData.value.admin.find(x => x.id === parentId);
  if (!p) return;
  if (!p.children) p.children = [];
  p.children.push({
    id: uid("child"),
    label: "Menu con mới",
    icon: "pi pi-circle",
    to: "",
    isActive: true,
  });
}

export function updateItem(id: string, patch: Partial<MenuItem>) {
  // tìm parent
  const p = menuData.value.admin.find(x => x.id === id);
  if (p) Object.assign(p, patch);

  // tìm child
  for (const par of menuData.value.admin) {
    const c = (par.children || []).find(x => x.id === id);
    if (c) Object.assign(c, patch);
  }
}

export function deleteItem(id: string) {
  // xóa parent
  const pIdx = menuData.value.admin.findIndex(x => x.id === id);
  if (pIdx >= 0) {
    menuData.value.admin.splice(pIdx, 1);
    return;
  }
  // xóa child
  for (const p of menuData.value.admin) {
    p.children = (p.children || []).filter(x => x.id !== id);
  }
}
