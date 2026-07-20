<script setup lang="ts">
defineProps<
{
  isChecked: boolean
}>();
</script>

<template>
    <local-container>
        <slot></slot>
        <span :class="{ checked : isChecked }">{{ isChecked ? "&#10004;" : "&#10008;"  }}</span>
    </local-container>
</template>

<style scoped>
local-container
{
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

span
{
    color: var(--color-error);
}

.checked
{
    color: var(--color-on);
}
</style>
