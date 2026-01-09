<template>
    <Dialog header="Create Request" v-model:visible="visible" :modal="true" :closable="true">
        <div class="form">
            <div class="p-fluid">
                <label>Title</label>
                <InputText v-model="payload.title" />
                <small v-if="errors.title" class="p-error">{{ errors.title }}</small>

                <label>Description</label>
                <Textarea v-model="payload.description" rows="4" />

                <label>Category</label>
                <Dropdown :options="categories" v-model="payload.category" optionLabel="label" optionValue="value" />

                <label>Department</label>
                <InputText v-model="payload.department" />

                <label>Severity</label>
                <Dropdown :options="severityOptions" v-model="payload.severity" />
                <small v-if="errors.severity" class="p-error">{{ errors.severity }}</small>

                <label>Attachments (mock)</label>
                <InputText v-model="fileName" placeholder="Enter file name and click Upload" />
                <Button label="Upload" class="p-button-secondary" @click="upload" />
                <ul>
                    <li v-for="a in payload.attachments" :key="a.id">{{ a.filename }}</li>
                </ul>

                <label v-if="showReason">Reason (required for HIGH/SPECIAL)</label>
                <Textarea v-if="showReason" v-model="reason" rows="2" />
                <small v-if="errors.reason" class="p-error">{{ errors.reason }}</small>
            </div>

            <div class="actions">
                <Button label="Save Draft" icon="pi pi-save" class="p-button-text" @click="saveDraft" />
                <Button label="Submit" icon="pi pi-send" class="p-button-primary" @click="submit" />
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useStore } from 'vuex';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'created']);

const store = useStore();
const visible = ref(props.visible);
watch(() => props.visible, (v) => visible.value = v);
watch(visible, (v) => emit('update:visible', v));

const payload = ref({ title: '', description: '', category: '', department: '', severity: 'LOW', attachments: [] as any[] });
const fileName = ref('');
const reason = ref('');
const errors = ref<any>({});

const categories = [{ label: 'Access', value: 'Access' }, { label: 'Equipment', value: 'Equipment' }, { label: 'IT Support', value: 'IT Support' }];
const severityOptions = [{ label: 'Low', value: 'LOW' }, { label: 'Medium', value: 'MEDIUM' }, { label: 'High', value: 'HIGH' }, { label: 'Special', value: 'SPECIAL' }];

const showReason = computed(() => payload.value.severity === 'HIGH' || payload.value.severity === 'SPECIAL');

function validate() {
    errors.value = {};
    if (!payload.value.title) errors.value.title = 'Title is required';
    if (!payload.value.severity) errors.value.severity = 'Select severity';
    if (showReason.value && !reason.value) errors.value.reason = 'Reason required for HIGH/SPECIAL';
    return Object.keys(errors.value).length === 0;
}

function saveDraft() {
    store.dispatch('support/createTicket', { ...payload.value, createdBy: 'web_user' }).then(() => {
        emit('created');
        visible.value = false;
    });
}

function submit() {
    if (!validate()) return;
    store.dispatch('support/createTicket', { ...payload.value, createdBy: 'web_user' }).then((t: any) => {
        store.dispatch('support/submitTicket', { id: t.id, actor: 'web_user' }).then(() => {
            emit('created');
            visible.value = false;
        });
    });
}

function upload() {
    if (!fileName.value) return;
    // mock attachment
    payload.value.attachments.push({ id: 'a-' + Math.random().toString(36).slice(2, 8), filename: fileName.value });
    fileName.value = '';
}
</script>

<style scoped>
.form {
    width: 640px
}

.actions {
    display: flex;
    gap: .5rem;
    justify-content: flex-end;
    margin-top: 1rem
}

.small {
    font-size: 12px
}
</style>