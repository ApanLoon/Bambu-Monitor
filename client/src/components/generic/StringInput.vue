<script setup lang="ts">
import { defineProps, defineEmits, ref, type Ref } from "vue";
import IconEdit from "../icons/IconEdit.vue";
const props = defineProps(
{
  value:     { type: String,  required: false },
  multiLine: { type: Boolean, required: false, default: false }
});

const emit = defineEmits
<{
    (e: 'change', value: string) : void
}>();

const isEdit : Ref<boolean> = ref(false);

const toggle = () =>
{
    if (isEdit === true)
    {
        change();
    }
    isEdit.value = !isEdit.value;
}
const change = () =>
{
    const input = document.getElementById (props.multiLine ? "input-multiline" : "input"); 
    if (input === null)
    {
        return;
    }

    if (props.value === input.value)
    {
        return;
    }

    emit("change", input.value);
}
</script>

<template>
    <local-container>
        <local-read v-if="isEdit === false">{{ props.value }}</local-read>
        <local-edit v-if="isEdit === true && props.multiLine === true"> <textarea          id="input-multiline" :value="props.value" @change="change" /></local-edit>
        <local-edit v-if="isEdit === true && props.multiLine === false"><input type="text" id="input"           :value="props.value" @change="change" /></local-edit>
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
input
{
    background-color: var(--color-background);
    color: var(--color-text);
    font-family: var(--font-family);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    width: 100%;
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
    margin-bottom: auto;
    margin-right: 2px;
}
button::active
{
    outline: none;
}
</style>