<template>
    <template v-if="!inline">
        <Dialog v-model:visible="visible" :header="headerTitle" :modal="true" style="width:900px">
            <div v-if="!loading">
                <div class="header-row">
                    <div class="left">
                        <h3>{{ ticket?.code }} - {{ ticket?.title }}</h3>
                        <Tag :value="formatSeverity(ticket)" class="p-mr-2" />
                        <Tag :value="formatStatus(ticket)" severity="info" />
                    </div>
                    <div class="right">
                        <small>SLA: {{ ticket?.sla?.resolveDueHours }}h</small>
                    </div>
                </div>

                <div class="panels">
                    <div class="panel">
                        <h4>General Information</h4>
                        <p><b>Department:</b> {{ ticket?.department }}</p>
                        <p><b>Location:</b> {{ ticket?.location }}</p>
                        <p><b>Contact:</b> {{ ticket?.contactPhone }}</p>
                    </div>
                    <div class="panel">
                        <h4>History</h4>
                        <ul>
                            <li v-for="h in ticket?.history" :key="h.id">{{ h.at }} - {{ h.actor }} - {{ h.action }} {{
                                h.message ? ("(" + h.message + ")") : '' }}</li>
                        </ul>
                    </div>
                </div>

                <div>
                    <h4>Discussion</h4>
                    <div>
                        <Textarea v-model="comment" rows="3" placeholder="Add a comment" />
                        <Button label="Send" @click="sendComment" />
                    </div>
                    <ul>
                        <li v-for="c in ticket?.comments" :key="c.id">{{ c.createdAt }} - <b>{{ c.author }}</b>: {{
                            c.message }}</li>
                    </ul>
                </div>

                <div class="actions">
                    <Button label="Assign to me" icon="pi pi-user" @click="assignToMe" />
                    <Button label="Mark as Resolved" icon="pi pi-check" class="p-button-success" @click="resolve" />
                </div>
            </div>
            <div v-else>Loading...</div>
        </Dialog>
    </template>
    <template v-else>
        <div class="ticket-detail-inline">
            <div v-if="!loading">
                <div class="header-row">
                    <div class="left">
                        <h3>{{ ticket?.code }} - {{ ticket?.title }}</h3>
                        <Tag :value="formatSeverity(ticket)" class="p-mr-2" />
                        <Tag :value="formatStatus(ticket)" severity="info" />
                    </div>
                    <div class="right">
                        <small>SLA: {{ ticket?.sla?.resolveDueHours }}h</small>
                    </div>
                </div>

                <div class="panels">
                    <div class="panel">
                        <h4>General Information</h4>
                        <p><b>Department:</b> {{ ticket?.department }}</p>
                        <p><b>Location:</b> {{ ticket?.location }}</p>
                        <p><b>Contact:</b> {{ ticket?.contactPhone }}</p>
                    </div>
                    <div class="panel">
                        <h4>History</h4>
                        <ul>
                            <li v-for="h in ticket?.history" :key="h.id">{{ h.at }} - {{ h.actor }} - {{ h.action }} {{
                                h.message ? ("(" + h.message + ")") : '' }}</li>

                        </ul>
                    </div>
                </div>

                <div>
                    <h4>Discussion s</h4>
                    <div>
                        <Textarea v-model="comment" rows="3" placeholder="Add a comment" />
                        <Button label="Send" @click="sendComment" />
                    </div>
                    <ul>
                        <li v-for="c in ticket?.comments" :key="c.id">{{ c.createdAt }} - <b>{{ c.author }}</b>: {{
                            c.message }}</li>
                    </ul>
                </div>

                <div class="actions">
                    <Button label="Assign to me" icon="pi pi-user" @click="assignToMe" />
                    <Button label="Mark as Resolved" icon="pi pi-check" class="p-button-success" @click="resolve" />
                </div>
            </div>
            <div v-else>Loading...</div>
        </div>
    </template>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Button from 'primevue/button';

const props = defineProps<{ id?: string | null, inline?: boolean }>();
const emit = defineEmits(['close']);
const inline = props.inline === true;
const visible = ref(true);

const store = useStore();
const ticket = ref<any>(null);
const loading = ref(false);
const comment = ref('');

watch(() => props.id, (id) => {
    if (id) {
        load(id);
        if (!inline) visible.value = true;
    } else {
        ticket.value = null;
        if (!inline) visible.value = false;
    }
});

async function load(id: string | undefined | null) {
    if (!id) return;
    loading.value = true;
    ticket.value = await store.dispatch('support/getTicket', id);
    loading.value = false;
}

const headerTitle = computed(() => ticket.value ? `${ticket.value.code} - ${ticket.value.title}` : 'Detail');

function formatSeverity(t: any) { const map: any = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', SPECIAL: 'Special' }; return t ? (map[t.severity] || t.severity) : ''; }
function formatStatus(t: any) { const map: any = { DRAFT: 'Draft', SUBMITTED: 'Submitted', PENDING_DEPT: 'Pending', PENDING_LEADER: 'Pending', PENDING_BOD: 'Pending', NEED_MORE_INFO: 'Need more info', REJECTED: 'Rejected', APPROVED: 'Approved', IN_PROGRESS: 'In Progress', WAITING_REQUESTER: 'Waiting Requester', RESOLVED: 'Resolved', CLOSED: 'Closed', REOPENED: 'Reopened' }; return t ? (map[t.status] || t.status) : ''; }

function sendComment() {
    if (!comment.value || !props.id) return;
    store.dispatch('support/addComment', { id: props.id, comment: comment.value, author: 'me' }).then(() => { comment.value = ''; load(props.id); });
}

function assignToMe() {
    if (!props.id) return;
    store.dispatch('support/updateTicket', { id: props.id, patch: { assignee: 'me' } }).then(() => load(props.id));
}

function resolve() {
    if (!props.id) return;
    store.dispatch('support/updateTicket', { id: props.id, patch: { status: 'RESOLVED' } }).then(() => load(props.id));
}
</script>

<style scoped>
.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center
}

.panels {
    display: flex;
    gap: 1rem
}

.panel {
    flex: 1;
    background: #fff;
    padding: 1rem;
    border-radius: 6px
}

.actions {
    display: flex;
    gap: .5rem;
    justify-content: flex-end;
    margin-top: .75rem
}
</style>