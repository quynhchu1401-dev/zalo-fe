<template>
    <div>
        <h3>Settings (Admin)</h3>
        <p>Manage categories and SLA (mock)</p>
        <div>
            <label>Categories</label>
            <ul>
                <li v-for="c in categories" :key="c">{{ c }}</li>
            </ul>
            <InputText v-model="newCat" placeholder="New category name" />
            <Button label="Add" @click="add" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
const categories = ref(['Access', 'Equipment', 'IT Support']);
const newCat = ref('');
function add() { if (newCat.value) { categories.value.push(newCat.value); newCat.value = ''; } }
</script>

<style scoped></style>