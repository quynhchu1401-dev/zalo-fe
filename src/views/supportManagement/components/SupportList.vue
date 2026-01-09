<template>
    <div>
        <div class="filters">
            <Dropdown :options="statusOptions" v-model="filter.status" placeholder="Status" @change="onFilter" />
            <Dropdown :options="severityOptions" v-model="filter.severity" placeholder="Severity" @change="onFilter" />
            <InputText v-model="filter.keyword" placeholder="Search..." @input="onFilter" />
            <Button label="Export CSV" icon="pi pi-file" class="p-button-secondary" @click="exportCsv" />
        </div>

        <DataTable :value="tickets" selectionMode="multiple" v-model:selection="selected" :paginator="true" :rows="10"
            :loading="loading">
            <Column selectionMode="multiple" style="width:3rem" />
            <Column field="code" header="Code" />
            <Column field="title" header="Title" />
            <Column header="Severity" :body="formatSeverity" />
            <Column header="Status" :body="formatStatus" />
            <Column field="department" header="Department" />
            <Column field="createdAt" header="Created At" body="formatDate" />
            <Column header="Actions" :body="actionTemplate" />
        </DataTable>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const store = useStore();
const tickets = computed(() => store.state.support.tickets || []);
const loading = computed(() => store.state.support.loading);
const selected = ref([] as any[]);

const filter = ref({ status: 'ALL', severity: 'ALL', keyword: '' });
const statusOptions = [{ label: 'All', value: 'ALL' }, { label: 'Submitted', value: 'SUBMITTED' }, { label: 'Pending (Dept)', value: 'PENDING_DEPT' }, { label: 'Pending (Leader)', value: 'PENDING_LEADER' }, { label: 'Approved', value: 'APPROVED' }];
const severityOptions = [{ label: 'All', value: 'ALL' }, { label: 'Low', value: 'LOW' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'High', value: 'HIGH' }, { label: 'Special', value: 'SPECIAL' }];

function onFilter() {
    store.commit('support/setFilter', filter.value);
    store.dispatch('support/fetchTickets');
}

function exportCsv() {
    store.dispatch('support/exportCsv', filter.value).then((csv: string) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tickets.csv'; a.click(); URL.revokeObjectURL(url);
    });
}

function formatDate(row: any) { return new Date(row.createdAt).toLocaleString(); }

function formatSeverity(row: any) {
    const map: any = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao', SPECIAL: 'Đặc biệt' };
    return map[row.severity] || row.severity;
}

function formatStatus(row: any) {
    const map: any = {
        DRAFT: 'Draft', SUBMITTED: 'Submitted', PENDING_DEPT: 'Pending', PENDING_LEADER: 'Pending', PENDING_BOD: 'Pending',
        NEED_MORE_INFO: 'Need more info', REJECTED: 'Rejected', APPROVED: 'Approved', IN_PROGRESS: 'In Progress', WAITING_REQUESTER: 'Waiting Requester', RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened'
    };
    return map[row.status] || row.status;
}

function actionTemplate(row: any) {
    return {
        // used by template feature of prime
    };
}

// Emitting openDetail - but DataTable Body templates require render function; we'll use row click
function rowClicked(e: any) {
    // not used
}
</script>

<style scoped>
.filters {
    display: flex;
    gap: 0.5rem;
    float: right;
    margin: 0.75rem
}
</style>