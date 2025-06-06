<script lang="ts" setup>
import { computed, inject, onMounted, ref, type Ref, watch } from "vue";
import type { IBambuMonitorClient } from "../../plugins/IBambuMonitorClient";

import Camera from "../Camera.vue"

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[StatusPage] Setup: No BambuMonitorClient plugin found.");
}

</script>

<template>
    <Camera></Camera>
</template>

<style scoped>
</style>
