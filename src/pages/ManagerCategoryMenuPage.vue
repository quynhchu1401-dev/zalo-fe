<template>
  <PageLayout title="Quản lý danh mục menu">
    <div class="menu-page">
      <!-- ================= TOOLBAR ================= -->
      <div class="toolbar">
        <div class="actions">
          <Button class="btn-primary" icon="pi pi-plus" label="Thêm menu cha" @click="openAdd('parent')" />
          <Button class="btn-primary" icon="pi pi-plus-circle" label="Thêm menu con" :disabled="!hasParents"
            @click="openAdd('child')" />
          <Button class="btn-outline" icon="pi pi-save" label="Lưu cấu hình" @click="saveAllChanges" />
          <Button class="btn-outline" icon="pi pi-refresh" label="Khôi phục mặc định" @click="confirmResetMenu" />
        </div>

        <span class="p-input-icon-left search">
          <i class="pi pi-search"></i>
          <InputText v-model="searchText" placeholder="Tìm menu..." />
        </span>
      </div>

      <!-- ================= LIST ================= -->
      <div class="list">
        <div v-for="p in filteredParents" :key="p.id" class="parent-item">
          <div class="parent-row">
            <div class="col-name">
              <i v-if="p.icon" :class="p.icon"></i>
              <strong>{{ p.label }}</strong>
            </div>

            <div class="col-status">
              <span class="badge" :class="{ off: p.isActive === false }">
                {{ p.isActive === false ? "ẨN" : "HIỂN THỊ" }}
              </span>
            </div>

            <div class="col-actions">
              <Button class="p-button-text p-button-sm" label="Sửa" @click="openEdit(p)" />
              <Button class="p-button-text p-button-sm" label="Thêm con" @click="openAdd('child', p.id)" />
              <Button class="p-button-text p-button-danger p-button-sm" label="Xóa" @click="confirmDelete(p.id)" />
            </div>
          </div>

          <ul class="child-list" v-if="p.children && p.children.length">
            <li v-for="c in p.children" :key="c.id">
              <span><i v-if="c.icon" :class="c.icon"></i> {{ c.label }}</span>

              <div class="actions">
                <Button class="p-button-text p-button-sm" icon="pi pi-pencil" @click="openEdit(c, p.id)" />
                <Button class="p-button-text p-button-danger p-button-sm" icon="pi pi-trash"
                  @click="confirmDelete(c.id)" />
              </div>
            </li>
          </ul>

          <div v-else class="no-children">Chưa có menu con</div>
        </div>
      </div>

      <ConfirmDialog />

      <!-- ================= DIALOG ADD/EDIT ================= -->
      <Dialog header="Thêm / Chỉnh sửa menu" v-model:visible="dialogVisible" :modal="true" :style="{ width: '500px' }">
        <div class="dialog-form">
          <div class="form-row">
            <label>Tên hiển thị <span class="required">*</span></label>
            <InputText v-model="form.label" />
          </div>

          <div class="form-row">
            <label>Icon (PrimeIcons)</label>
            <InputText v-model="form.icon" placeholder="vd: pi pi-home" />
          </div>

          <div class="form-row">
            <label>Route (to)</label>
            <InputText v-model="form.to" placeholder="vd: /sendmessage" />
          </div>

          <div class="form-row">
            <label>Loại</label>
            <Dropdown v-model="form.type" :options="TYPE_OPTIONS" optionLabel="label" optionValue="value" />
          </div>

          <div class="form-row" v-if="form.type === 'child'">
            <label>Menu cha <span class="required">*</span></label>
            <Dropdown v-model="form.parentId" :options="parentOptions" optionLabel="label" optionValue="value"
              placeholder="Chọn menu cha" />
          </div>

          <div class="form-row switch-row">
            <label>Hiển thị</label>
            <InputSwitch v-model="form.isActive" />
          </div>

          <div class="form-actions">
            <Button class="btn-primary" icon="pi pi-check" label="Lưu" @click="submitForm" />
            <Button class="btn-outline" icon="pi pi-times" label="Huỷ" @click="dialogVisible = false" />
          </div>
        </div>
      </Dialog>
    </div>
  </PageLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import PageLayout from "@/components/PageLayout.vue";

import type { MenuItem } from "@/config/menuStore";
import { loadMenu, saveCurrent, menuData } from "@/config/menuStore";
// Nếu menuStore của bạn có export sidebarMenuDefault thì bật import này để reset chuẩn:
// import { sidebarMenuDefault } from "@/config/menuStore";

const toast = useToast();
const confirm = useConfirm();

const TYPE_OPTIONS = [
  { label: "Menu cha", value: "parent" },
  { label: "Menu con", value: "child" },
];

const searchText = ref("");
const dialogVisible = ref(false);
const isEdit = ref(false);

const form = reactive({
  id: "",
  label: "",
  icon: "",
  to: "",
  type: "parent" as "parent" | "child",
  parentId: null as string | null,
  isActive: true,
});

/** =========================
 *  DATA SOURCE (single source of truth)
 *  ========================= */
const parents = computed<MenuItem[]>(() => menuData.value.admin || []);

const parentOptions = computed(() => parents.value.map((p) => ({ label: p.label, value: p.id })));
const hasParents = computed(() => parents.value.length > 0);

const filteredParents = computed(() => {
  const q = (searchText.value || "").toLowerCase().trim();
  if (!q) return parents.value;

  return parents.value.filter(
    (p) =>
      (p.label || "").toLowerCase().includes(q) ||
      (p.children || []).some((c) => (c.label || "").toLowerCase().includes(q))
  );
});

/** =========================
 *  HELPERS
 *  ========================= */
const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

function findParentByChildId(childId: string) {
  return parents.value.find((p) => (p.children || []).some((c) => c.id === childId)) || null;
}

function findItem(id: string): { parent: MenuItem | null; item: MenuItem | null } {
  const p = parents.value.find((x) => x.id === id);
  if (p) return { parent: null, item: p };

  for (const par of parents.value) {
    const c = (par.children || []).find((x) => x.id === id);
    if (c) return { parent: par, item: c };
  }
  return { parent: null, item: null };
}

/** =========================
 *  LOAD / SAVE
 *  ========================= */
const loadData = async () => {
  try {
    await loadMenu(); // GET /api/menu
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e?.message || "Không thể tải menu từ server",
      life: 2500,
    });
  }
};

const saveAllChanges = async () => {
  try {
    await saveCurrent(); // PUT /api/menu
    toast.add({ severity: "success", summary: "Lưu", detail: "Đã lưu vào menu.json", life: 1200 });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "Lỗi",
      detail: e?.message || "Không thể lưu vào menu.json",
      life: 2500,
    });
  }
};

/** =========================
 *  DIALOG (ADD / EDIT)
 *  ========================= */
const openAdd = (type: "parent" | "child", parentId?: string) => {
  isEdit.value = false;
  form.id = "";
  form.label = type === "parent" ? "Menu cha mới" : "Menu con mới";
  form.icon = "";
  form.to = "";
  form.type = type;

  if (type === "child") {
    form.parentId = parentId || parentOptions.value[0]?.value || null;
  } else {
    form.parentId = null;
  }

  form.isActive = true;
  dialogVisible.value = true;
};

const openEdit = (item: MenuItem, parentId?: string) => {
  isEdit.value = true;
  form.id = item.id;
  form.label = item.label || "";
  form.icon = item.icon || "";
  form.to = item.to || "";
  form.type = parentId ? "child" : "parent";
  form.parentId = parentId || null;
  form.isActive = item.isActive !== false;
  dialogVisible.value = true;
};

const submitForm = async () => {
  const lbl = (form.label || "").trim();
  if (!lbl) {
    toast.add({ severity: "warn", summary: "Thiếu dữ liệu", detail: "Tên hiển thị không được để trống", life: 1500 });
    return;
  }
  if (form.type === "child" && !form.parentId) {
    toast.add({ severity: "warn", summary: "Thiếu dữ liệu", detail: "Menu con phải chọn menu cha", life: 1500 });
    return;
  }

  // ===== EDIT
  if (isEdit.value) {
    const hit = findItem(form.id);
    if (!hit.item) {
      toast.add({ severity: "warn", summary: "Không tìm thấy", detail: "Không tìm thấy item để sửa", life: 1500 });
      return;
    }

    // nếu đang sửa child và đổi parent -> move child sang parent mới
    if (form.type === "child" && form.parentId) {
      const currentParent = findParentByChildId(form.id);
      const nextParent = parents.value.find((p) => p.id === form.parentId) || null;

      if (!nextParent) {
        toast.add({ severity: "warn", summary: "Thiếu dữ liệu", detail: "Menu cha không hợp lệ", life: 1500 });
        return;
      }

      // remove khỏi parent cũ (nếu có)
      if (currentParent?.children) {
        currentParent.children = currentParent.children.filter((c) => c.id !== form.id);
      }

      // add vào parent mới
      if (!nextParent.children) nextParent.children = [];
      nextParent.children.push({
        id: form.id,
        label: lbl,
        icon: form.icon || "",
        to: form.to || "",
        isActive: form.isActive,
      });
    } else {
      // sửa bình thường
      Object.assign(hit.item, {
        label: lbl,
        icon: form.icon || "",
        to: form.to || "",
        isActive: form.isActive,
      });
    }
  } else {
    // ===== CREATE
    if (form.type === "parent") {
      parents.value.push({
        id: uid("p"),
        label: lbl,
        icon: form.icon || "",
        to: form.to || "",
        isActive: form.isActive,
        children: [],
      });
    } else {
      const p = parents.value.find((x) => x.id === form.parentId);
      if (!p) {
        toast.add({ severity: "warn", summary: "Thiếu dữ liệu", detail: "Menu cha không hợp lệ", life: 1500 });
        return;
      }
      if (!p.children) p.children = [];
      p.children.push({
        id: uid("c"),
        label: lbl,
        icon: form.icon || "",
        to: form.to || "",
        isActive: form.isActive,
      });
    }
  }

  dialogVisible.value = false;

  // auto-save để reload không mất
  await saveAllChanges();
};

/** =========================
 *  DELETE
 *  ========================= */
const confirmDelete = (id: string) => {
  confirm.require({
    header: "Xác nhận xoá",
    icon: "pi pi-exclamation-triangle",
    message: "Bạn chắc chắn muốn xoá? Nếu là menu cha sẽ xoá luôn các menu con.",
    acceptLabel: "Xoá",
    rejectLabel: "Huỷ",
    accept: async () => {
      doDelete(id);
      await saveAllChanges();
      toast.add({ severity: "success", summary: "Thành công", detail: "Đã xóa menu", life: 1200 });
    },
  });
};

const doDelete = (id: string) => {
  // xóa parent
  const pIdx = parents.value.findIndex((p) => p.id === id);
  if (pIdx >= 0) {
    parents.value.splice(pIdx, 1);
    return;
  }

  // xóa child
  for (const p of parents.value) {
    if (!p.children?.length) continue;
    p.children = p.children.filter((c) => c.id !== id);
  }
};

/** =========================
 *  RESET DEFAULT
 *  ========================= */
const confirmResetMenu = () => {
  confirm.require({
    header: "Xác nhận khôi phục",
    icon: "pi pi-refresh",
    message: "Khôi phục menu về mặc định? Sẽ mất cấu hình đang chỉnh.",
    acceptLabel: "Khôi phục",
    rejectLabel: "Huỷ",
    accept: async () => {
      try {
        // Cách A (khuyên dùng): nếu menuStore export sidebarMenuDefault
        // menuData.value = JSON.parse(JSON.stringify(sidebarMenuDefault));

        // Cách B (an toàn nếu chưa có sidebarMenuDefault): chỉ reload lại từ server
        // -> nếu bạn muốn reset về default thật sự, hãy làm endpoint reset ở server.
        await loadData();

        // nếu bạn dùng Cách A thì bật dòng này để ghi xuống file
        // await saveAllChanges();

        toast.add({ severity: "success", summary: "Thành công", detail: "Đã khôi phục", life: 1200 });
      } catch (e: any) {
        toast.add({ severity: "error", summary: "Lỗi", detail: e?.message || "Không thể khôi phục", life: 2500 });
      }
    },
  });
};

/** =========================
 *  INIT
 *  ========================= */
onMounted(async () => {
  await loadData();
});
</script>

<style scoped lang="scss">
.menu-page {
  padding: 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search {
  width: 300px;
}

.list {
  display: grid;
  gap: 12px;
}

.parent-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background: #fff;
}

.parent-row {
  display: grid;
  grid-template-columns: 1fr 100px 180px;
  gap: 12px;
  align-items: center;
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.col-status {
  text-align: center;
}

.col-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  font-size: 12px;
  font-weight: 500;
}

.badge.off {
  opacity: 0.6;
}

.child-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
  display: grid;
  gap: 8px;
}

.child-list li {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #3b82f6;
}

.child-list .actions {
  display: flex;
  gap: 4px;
}

.no-children {
  padding: 12px 8px;
  color: #9ca3af;
  font-size: 13px;
}

.dialog-form {
  display: grid;
  gap: 16px;
}

.form-row {
  display: grid;
  gap: 6px;
}

.form-row label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.switch-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: center;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}

.btn-primary {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: #fff !important;

  &:hover {
    background: #2563eb !important;
    border-color: #2563eb !important;
  }
}

.btn-outline {
  background: #fff !important;
  border-color: #d1d5db !important;
  color: #374151 !important;

  &:hover {
    border-color: #9ca3af !important;
  }
}

:deep(.p-button-sm) {
  padding: 0.5rem 0.75rem !important;
  font-size: 12px !important;
}
</style>
