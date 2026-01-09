<template>
    <div class="dashboard">
        <div class="cards">
            <div class="card" v-for="(v, k) in metrics" :key="k">
                <div class="label">{{ k }}</div>
                <div class="value">{{ v }}</div>
            </div>
        </div>

        <div class="lists">
            <div class="panel">
                <h4>Overdue - Pending Approval</h4>
                <ul>
                    <li v-for="t in overdueApprovals" :key="t.id">{{ t.code }} - {{ t.title }} ({{ formatStatus(t) }})
                    </li>
                </ul>
            </div>
            <div class="panel">
                <h4>Overdue - In Progress</h4>
                <ul>
                    <li v-for="t in overdueProcessing" :key="t.id">{{ t.code }} - {{ t.title }} ({{ formatStatus(t) }})
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
const store = useStore();

const metrics = computed(() => {
    const counts = store.getters['support/counts'];
    return { 'Total': counts.total, 'Pending': counts.waiting, 'In Progress': counts.inProgress, 'Done': counts.done };
});

const overdueApprovals = computed(() => store.state.support.tickets.filter((t: any) => t.status.startsWith('PENDING') && new Date(t.dueAt) < new Date()));
const overdueProcessing = computed(() => store.state.support.tickets.filter((t: any) => (t.status === 'IN_PROGRESS' || t.status === 'APPROVED') && new Date(t.dueAt) < new Date()));

function formatStatus(row: any) { const map: any = { DRAFT: 'Draft', SUBMITTED: 'Submitted', PENDING_DEPT: 'Pending', PENDING_LEADER: 'Pending', PENDING_BOD: 'Pending', NEED_MORE_INFO: 'Need more info', REJECTED: 'Rejected', APPROVED: 'Approved', IN_PROGRESS: 'In Progress', WAITING_REQUESTER: 'Waiting Requester', RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened' }; return row ? (map[row.status] || row.status) : ''; }
</script>

<style scoped>
.cards {
    display: flex;
    gap: 1rem;
    margin: 0;
}

.card {
    padding: 1rem;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, .08);
    min-width: 120px
}

.label {
    font-size: 12px;
    color: #666
}

.value {
    font-weight: 700;
    font-size: 20px
}

.lists {
    display: flex;
    gap: 1rem
}

.panel {
    flex: 1;
    background: #fff;
    padding: 1rem;
    border-radius: 6px
}
</style>