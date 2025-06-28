<script setup lang="ts">
import { defineProps, defineEmits, ref, type Ref } from "vue";
import IconEdit from "../icons/IconEdit.vue";
const props = defineProps(
{
  value:     { type: String,  required: false }
});

const emit = defineEmits
<{
    (e: 'change', value: string) : void
}>();

const isEdit : Ref<boolean> = ref(false);

const toggle = () =>
{
    isEdit.value = !isEdit.value;
}
</script>

<template>
    <local-container>
        <local-read v-if="isEdit === false">{{ props.value }}</local-read>
        <local-edit v-if="isEdit === true"><textarea name="Comment" :value="props.value" /></local-edit>
        <button @click="toggle()"><IconEdit></IconEdit></button>
    </local-container>
</template>

<style lang="css" scoped>
local-container
{
    display: flex;
    justify-content: space-between;
    align-content:start;
    gap: 0.5rem;
}
local-edit
{
    flex: 1 1;
}
textarea
{
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: var(--font-family);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    resize: none;
    width: 100%;
    height: 3rem;
    font-size: inherit;
}
button
{
    display: flex;
    appearance: none;
    color: var(--color-text);
    border: none;
    background-color: transparent;
    padding: 0;
}
button::active
{
    outline: none;
}
</style>