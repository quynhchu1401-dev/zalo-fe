<template>
    <div>
        <TabView>
            <TabPanel header="Pending - Dept">
                <ul>
                    <li v-for="t in pendingDept" :key="t.id">{{ t.code }} - {{ t.title }} ({{ formatStatus(t) }})
                        <Button title="Approve" icon="pi pi-check" class="p-button-text"
                            @click="openApprove(t, 'APPROVE')" />
                        <Button title="Reject" icon="pi pi-times" class="p-button-text p-button-danger"
                            @click="openApprove(t, 'REJECT')" />
                        <Button title="Request more info" icon="pi pi-comment" class="p-button-text"
                            @click="openApprove(t, 'REQUEST_MORE_INFO')" />
                    </li>
                </ul>
            </TabPanel>
            <TabPanel header="Pending - Leader">
                <ul>
                    <li v-for="t in pendingLeader" :key="t.id">{{ t.code }} - {{ t.title }} ({{ formatStatus(t) }})
                        <Button title="Approve" icon="pi pi-check" class="p-button-text"
                            @click="openApprove(t, 'APPROVE')" />
                        <Button title="Reject" icon="pi pi-times" class="p-button-text p-button-danger"
                            @click="openApprove(t, 'REJECT')" />
                        <Button title="Request more info" icon="pi pi-comment" class="p-button-text"
                            @click="openApprove(t, 'REQUEST_MORE_INFO')" />
                    </li>
                </ul>
            </TabPanel>
            <TabPanel header="Pending - BOD">
                <ul>
                    <li v-for="t in pendingBod" :key="t.id">{{ t.code }} - {{ t.title }} ({{ formatStatus(t) }})
                        <Button title="Approve" icon="pi pi-check" class="p-button-text"
                            @click="openApprove(t, 'APPROVE')" />
                        <Button title="Reject" icon="pi pi-times" class="p-button-text p-button-danger"
                            @click="openApprove(t, 'REJECT')" />
                        <Button title="Request more info" icon="pi pi-comment" class="p-button-text"
                            @click="openApprove(t, 'REQUEST_MORE_INFO')" />
                    </li>
                </ul>
            </TabPanel>
        </TabView>

        <Dialog header="Approve / Reject / Request More Info" v-model:visible="modalVisible">
            <div>
                <p>Request: <b>{{ current?.code }}</b> - {{ current?.title }}</p>
                <label>Reason / Message (required when rejecting/requesting)</label>
                <Textarea v-model="reason" rows="3" />
                <div class="actions">
                    <Button label="Confirm" icon="pi pi-check" @click="confirm" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

const store = useStore();
const modalVisible = ref(false);
const current = ref<any>(null);
const action = ref<'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO'>('APPROVE');
const reason = ref('');

const pendingDept = computed(() => store.state.support.tickets.filter((t: any) => t.status === 'PENDING_DEPT'));
const pendingLeader = computed(() => store.state.support.tickets.filter((t: any) => t.status === 'PENDING_LEADER'));
const pendingBod = computed(() => store.state.support.tickets.filter((t: any) => t.status === 'PENDING_BOD'));

function openApprove(t: any, a: any) { current.value = t; action.value = a; modalVisible.value = true; }

function formatStatus(row: any) { const map: any = { DRAFT: 'Draft', SUBMITTED: 'Submitted', PENDING_DEPT: 'Pending', PENDING_LEADER: 'Pending', PENDING_BOD: 'Pending', NEED_MORE_INFO: 'Need more info', REJECTED: 'Rejected', APPROVED: 'Approved', IN_PROGRESS: 'In Progress', WAITING_REQUESTER: 'Waiting Requester', RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened' }; return row ? (map[row.status] || row.status) : ''; }

function confirm() {
    if ((action.value === 'REJECT' || action.value === 'REQUEST_MORE_INFO') && !reason.value) { return; }
    store.dispatch('support/approveTicket', { id: current.value.id, actor: 'approver', action: action.value, reason: reason.value }).then(() => {
        modalVisible.value = false; reason.value = ''; store.dispatch('support/fetchTickets');
    });
}
</script>

<style scoped>
.actions {
    margin-top: .75rem
}
</style>