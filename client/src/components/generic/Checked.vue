<script setup lang="ts">
defineProps<
{
  isChecked: boolean
}>();
</script>

<template>
    <local-container>
        <slot></slot>
        <!-- The &#xFE0E; character prevents iOS from replacing the characters with emojis that doesn't change colour: -->
        <span :class="{ checked : isChecked }">{{ isChecked ? "&#10004;" : "&#10008;" }}&#xFE0E;</span>
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
