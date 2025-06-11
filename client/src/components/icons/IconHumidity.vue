<script setup lang="ts">
import { v4 as uuid } from "uuid";

const props = defineProps(
{
  fill: { type : Number, required : true }
});

const gradientId = "gradient-" + uuid();
const gradientRef =`url(#${gradientId})`;
</script>

<template>
    <svg width="8.219347mm" height="10mm" viewBox="0 0 8.219347 10" version="1.1" id="svg1" xmlns="http://www.w3.org/2000/svg" xmlns:svg="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient :id="gradientId" gradientTransform="rotate(90)">
                <stop :offset="1 - props.fill" stop-color="transparent"></stop>
                <stop offset="0" stop-color="#6492ce"></stop>
            </linearGradient>
        </defs>
            <path stroke="currentColor"
                  stroke-width="0.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-dasharray="none"
                  stroke-opacity="1"
                  :fill="gradientRef"
                  d="m 8.0362545,5.8903265 c 0,2.1685905 -1.7579805,3.9265805 -3.9265808,3.9265805 -2.1685903,0 -3.92658066,-1.75799 -3.92658066,-3.9265805 0,-2.1685903 3.16787176,-3.5980157 3.78961066,-5.70724093 C 4.5933754,2.2923108 8.0362545,3.7217362 8.0362545,5.8903265 Z" />
    </svg>
</template>

<style scoped>

svg
{
    width: auto;
    height: 1rem;
}
</style>