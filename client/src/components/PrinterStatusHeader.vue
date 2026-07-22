<script lang="ts" setup>
import { inject } from "vue";
import type { IBambuMonitorClient } from "../plugins/IBambuMonitorClient";
import { AmsRfidStatus, AmsStatus2String } from "../../../server/src/shared/BambuAmsTypes";
import { HomeFlag, SdCardState } from "../../../server/src/shared/BambuMessages.ts";

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[JobHeader] Setup: No BambuMonitorClient plugin found.");
}
</script>

<template>
    <local-job class="box" >
        <local-item><h1>AMS</h1><span>{{ AmsStatus2String(bambuMonitorClient.Status.value.ams_status, true) }}</span></local-item>
        <local-item><h1>RFID</h1><span>{{ AmsRfidStatus[bambuMonitorClient.Status.value.ams_rfid_status] }}</span></local-item>
        <local-item><h1>Nozzle</h1><span>{{ bambuMonitorClient.Status.value.nozzle_type }} {{ bambuMonitorClient.Status.value.nozzle_diameter }}mm</span></local-item>
        <local-item><h1>SD Card</h1><span> {{  SdCardState[bambuMonitorClient.SdCardState.value] }}</span></local-item>
        <local-item><h1>Home</h1>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_x_axis_home)">X</span>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_y_axis_home)">Y</span>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_z_axis_home)">Z</span>
        </local-item>
    </local-job>
</template>

<style scoped>
local-job
{
    display: flex;
    flex-direction: column;
}
local-item
{
    display: flex;
    justify-content: space-between;
}

h1
{
    margin: 0;
    margin-right: 0.5rem;
    padding: 0;
    color: var(--color-text-highlight);
    font-size: inherit;
}
</style>
