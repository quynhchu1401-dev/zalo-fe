<template>
    <div class="support-page">
        <!-- Header -->
        <div class="page-header">
            <div class="title-block">
                <div class="title-row">
                    <span class="page-title">Support Management</span>
                    <span class="page-subtitle">Track • Approve • Coordinate • Monitor SLA</span>
                </div>

                <!-- KPI chips (quick overview) -->
                <div class="kpi-row">
                    <Chip class="kpi" :label="`Total: ${totalCount}`" icon="pi pi-ticket" />
                    <Chip class="kpi warn" :label="`Pending: ${pendingApprovalCount}`" icon="pi pi-clock" />
                    <Chip class="kpi danger" :label="`Overdue: ${overdueCount}`" icon="pi pi-exclamation-triangle" />
                    <Chip class="kpi" :label="`In Progress: ${inProgressCount}`" icon="pi pi-cog" />
                    <Chip class="kpi success" :label="`Resolved: ${resolvedCount}`" icon="pi pi-check" />
                </div>
            </div>

            <!-- Right controls -->
            <div class="header-actions">
                <Dropdown :options="roles" v-model="role" optionLabel="label" optionValue="value"
                    placeholder="Select role" class="role-dd" @change="onRoleChange" />

                <Button label="Create Request" icon="pi pi-plus" class="p-button-success" @click="openCreate" />
            </div>
        </div>

        <!-- Toolbar -->
        <div class="toolbar">
            <div class="toolbar-left">
                <span class="p-input-icon-left search">
                    <i class="pi pi-search"></i>
                    <InputText v-model="keyword" placeholder="Search by code / title / department..."
                        @input="onKeywordInput" />
                </span>

                <Button icon="pi pi-refresh" label="Refresh" class="p-button-outlined" @click="fetch" />
            </div>

            <div class="toolbar-right">
                <!-- Quick hints / context -->
                <div class="hint">
                    <i class="pi pi-info-circle"></i>
                    <span>
                        The <b>Approval Center</b> tab only shows requests within the selected role's scope.
                    </span>
                </div>
            </div>
        </div>

        <!-- Main content -->
        <div class="content-card">
            <TabView>
                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-chart-bar"></i>
                            <span>Dashboard</span>
                        </div>
                    </template>
                    <Dashboard />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-list"></i>
                            <span>Support List</span>
                            <Badge v-if="totalCount > 0" :value="totalCount" class="ml-2" />
                        </div>
                    </template>
                    <SupportList @openDetail="openDetail" />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-verified"></i>
                            <span>Approval Center</span>
                            <Badge v-if="pendingApprovalCount > 0" :value="pendingApprovalCount" severity="warning"
                                class="ml-2" />
                        </div>
                    </template>
                    <ApprovalCenter />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-file"></i>
                            <span>Reports</span>
                        </div>
                    </template>
                    <Reports />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <div class="tab-header">
                            <i class="pi pi-cog"></i>
                            <span>Settings</span>
                        </div>
                    </template>
                    <Settings />
                </TabPanel>
            </TabView>
        </div>

        <!-- Dialogs / Overlays -->
        <CreateDialog v-model:visible="createVisible" @created="onCreated" />

        <!-- Ticket Detail as Sidebar for monitoring -->
        <Sidebar v-model:visible="detailVisible" position="right" class="detail-sidebar" :showCloseIcon="true">
            <template #header>
                <div class="detail-title">
                    <i class="pi pi-ticket"></i>
                    <span>Ticket Detail</span>
                </div>
            </template>

            <!-- show inline content inside the sidebar to avoid Dialog portal timing issues -->
            <TicketDetail v-if="detailId" :id="detailId" inline @close="closeDetail" />
        </Sidebar>

        <Toast />
        <ConfirmDialog />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount } from "vue";
import { useStore } from "vuex";

import Dashboard from "./components/Dashboard.vue";
import SupportList from "./components/SupportList.vue";
import ApprovalCenter from "./components/ApprovalCenter.vue";
import Reports from "./components/Reports.vue";
import Settings from "./components/Settings.vue";
import CreateDialog from "./components/CreateDialog.vue";
import TicketDetail from "./components/TicketDetail.vue";
import { roles as roleOptions } from "./components/constants";

import TabView from "primevue/tabview";
import TabPanel from "primevue/tabpanel";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Dropdown from "primevue/dropdown";
import Chip from "primevue/chip";
import Badge from "primevue/badge";
import Sidebar from "primevue/sidebar";
import Toast from "primevue/toast";
import ConfirmDialog from "primevue/confirmdialog";

const store = useStore();

const createVisible = ref(false);

const detailId = ref<string | null>(null);
const detailVisible = ref(false);

const keyword = ref("");
const roles = roleOptions;
const role = ref(store.state.support?.role || "REQUESTER");

// --- KPI computed (safe fallback if store not ready) ---
const tickets = computed<any[]>(() => store.state.support?.tickets || []);

const totalCount = computed(() => tickets.value.length);

const pendingApprovalCount = computed(() => {
    // Adjust status names if your store uses different enums
    const pendingStatuses = new Set(["PENDING_DEPT", "PENDING_LEADER", "PENDING_BOD"]);
    return tickets.value.filter(t => pendingStatuses.has(t.status)).length;
});

const overdueCount = computed(() => {
    // If store has explicit isOverdue flag, use it. Otherwise fallback to dueAt < now
    const now = Date.now();
    return tickets.value.filter(t => {
        if (typeof t.isOverdue === "boolean") return t.isOverdue;
        if (!t.dueAt) return false;
        const due = new Date(t.dueAt).getTime();
        return Number.isFinite(due) && due < now && !["RESOLVED", "CLOSED"].includes(t.status);
    }).length;
});

const inProgressCount = computed(() => tickets.value.filter(t => t.status === "IN_PROGRESS").length);
const resolvedCount = computed(() => tickets.value.filter(t => ["RESOLVED", "CLOSED"].includes(t.status)).length);

// --- Actions ---
function openCreate() {
    createVisible.value = true;
}

function onCreated() {
    createVisible.value = false;
    store.dispatch("support/fetchTickets");
}

function openDetail(id: string) {
    detailId.value = id;
    detailVisible.value = true;
}

function closeDetail() {
    detailVisible.value = false;
    detailId.value = null;
}

// Toggle a class on the global layout so it can resize when the right-side detail sidebar opens
watch(detailVisible, (open) => {
    const layout = document.querySelector('.layout-main') as HTMLElement | null;
    if (layout) {
        layout.classList.toggle('detail-open', !!open);
    }
});

onBeforeUnmount(() => {
    const layout = document.querySelector('.layout-main') as HTMLElement | null;
    if (layout) layout.classList.remove('detail-open');
});

function onRoleChange(e: any) {
    store.commit("support/setRole", e.value);
    // role changes often affect what user can see/do (approval scopes)
    fetch();
}

function fetch() {
    store.dispatch("support/fetchTickets", { keyword: keyword.value });
}

// Debounce keyword search to avoid calling fetch on every keystroke
let keywordTimer: number | null = null;
function onKeywordInput() {
    if (keywordTimer) window.clearTimeout(keywordTimer);
    keywordTimer = window.setTimeout(() => fetch(), 300);
}

onMounted(() => {
    fetch();
});
</script>

<style scoped>
.support-page {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 5%;
}

/* Header */
.page-header {
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem;
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
}

/* Do not use fixed percentage margins tied to the global sidebar.
       Instead the layout is allowed to flow naturally and CSS variables
       manage global offsets (see App.vue for variables). */
.title-block {
    display: flex;
    flex-direction: column;
    gap: .75rem;
    width: 100%;
    transition: margin 0.18s ease, width 0.18s ease;
    margin-left: 19%;
}

.title-row {
    display: flex;
    flex-direction: column;
    gap: .25rem;
}

/* Make main content adapt smoothly when layout margins change */
.content-card {
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    overflow: hidden;
    transition: all 0.18s ease;
}

.kpi-row {
    display: flex;
    flex-wrap: wrap;
    gap: .5rem;
}

.kpi :deep(.p-chip-text) {
    font-weight: 600;
}

.kpi.warn {
    border: 1px solid rgba(240, 173, 78, .45);
}

.kpi.danger {
    border: 1px solid rgba(217, 83, 79, .45);
}

.kpi.success {
    border: 1px solid rgba(92, 184, 92, .45);
}

.header-actions {
    display: flex;
    gap: .5rem;
    align-items: center;
}

.role-dd {
    width: 220px;
}

/* Toolbar */
.toolbar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: .75rem 1rem;
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
}

.toolbar-left {
    display: flex;
    gap: .5rem;
    align-items: center;
    flex-wrap: wrap;
}

.search {
    width: min(420px, 100%);
}

.toolbar-right .hint {
    display: flex;
    gap: .5rem;
    align-items: center;
    color: var(--text-color-secondary);
    font-size: .85rem;
}

/* Content */
.content-card {
    border-radius: 12px;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    overflow: hidden;
}

/* Tab header */
.tab-header {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
}

.ml-2 {
    margin-left: .5rem;
}

/* Sidebar detail */
.detail-sidebar :deep(.p-sidebar-content) {
    padding: 0;
    width: 360px !important;
    transition: width .2s ease;
}

.detail-title {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    font-weight: 700;
}
</style>
