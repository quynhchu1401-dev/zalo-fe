<template>
    <div>
        <h3>Reports</h3>
        <div class="filters">
            <label>From</label>
            <InputText v-model="from" placeholder="YYYY-MM-DD" />
            <label>To</label>
            <InputText v-model="to" placeholder="YYYY-MM-DD" />
            <Button label="Run" @click="run" />
            <Button label="Export CSV" class="p-button-secondary" @click="exportCsv" />
        </div>

        <div class="cards">
            <div>Total: {{ metrics.total }}</div>
            <div>Avg approval time (mock): {{ metrics.avgApproval }}h</div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useStore } from 'vuex';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const store = useStore();
const from = ref('');
const to = ref('');
const metrics = reactive({ total: 0, avgApproval: 0 });

function run() {
    store.dispatch('support/fetchTickets').then(() => {
        const list = store.state.support.tickets;
        metrics.total = list.length;
        metrics.avgApproval = Math.round((Math.random() * 48) * 100) / 100;
    });
}

function exportCsv() {
    store.dispatch('support/exportCsv', { dateFrom: from.value, dateTo: to.value }).then((csv: any) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'report.csv'; a.click(); URL.revokeObjectURL(url);
    });
}
</script>

<style scoped>
.filters {
    display: flex;
    gap: .5rem;
    align-items: center
}

.cards {
    margin-top: 1rem;
    display: flex;
    gap: 1rem
}
</style>