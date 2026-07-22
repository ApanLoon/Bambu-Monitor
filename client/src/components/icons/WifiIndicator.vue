<script setup lang="ts">
defineProps<
{
  strength: number
}>();
</script>
<template>
    <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="100" height="100" class="wifi-icon" :class="
        {
          'connection-excellent' : strength >= -60,
          'connection-good'      : strength >= -67 && strength < -60,
          'connection-fair'      : strength >= -70 && strength < -67,
          'connection-weak'      : strength >= -80 && strength < -70
        }">
    <!-- Base Dot (Always visible) -->
    <circle cx="12" cy="21" r="1.5" fill="currentColor" />
    
    <!-- Bar 1 (Weak) -->
    <path class="wifi-bar bar-1" d="M9.16 18c1.62-1.2 4.06-1.2 5.68 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Bar 2 (Fair) -->
    <path class="wifi-bar bar-2" d="M6.32 15.18c3.14-2.5 8.22-2.5 11.36 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Bar 3 (Good) -->
    <path class="wifi-bar bar-3" d="M3.48 12.36c4.66-3.8 12.38-3.8 17.04 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Bar 4 (Excellent) -->
    <path class="wifi-bar bar-4" d="M0.64 9.54C6.18 5.1 17.18 5.1 22.72 9.54" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
</template>
<style scoped>
svg
{
	display: inline-block;
	width: 0.8rem;
	height: 0.8rem;
}

.wifi-bar
{
  opacity: 0.3;
  transition: opacity 0.2s ease-in-out;
}

/* 1 Bar Active */
.wifi-icon.connection-weak .bar-1 { opacity: 1; }

/* 2 Bars Active */
.wifi-icon.connection-fair .bar-1,
.wifi-icon.connection-fair .bar-2 { opacity: 1; }

/* 3 Bars Active */
.wifi-icon.connection-good .bar-1,
.wifi-icon.connection-good .bar-2,
.wifi-icon.connection-good .bar-3 { opacity: 1; }

/* 4 Bars Active */
.wifi-icon.connection-excellent .bar-1,
.wifi-icon.connection-excellent .bar-2,
.wifi-icon.connection-excellent .bar-3,
.wifi-icon.connection-excellent .bar-4 { opacity: 1; }
</style>
