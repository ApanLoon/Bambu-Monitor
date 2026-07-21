<script lang="ts" setup>
import { inject, computed } from "vue";
import type { IBambuMonitorClient } from "../plugins/IBambuMonitorClient";
import { AmsRfidStatus, AmsStatus2String } from "../../../server/src/shared/BambuAmsTypes";
import { HomeFlag, SdCardState } from "../../../server/src/shared/BambuMessages.ts";


const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[JobHeader] Setup: No BambuMonitorClient plugin found.");
}

const RemainingTime = computed<string>(() =>
{
    let minutes = bambuMonitorClient.Status.value.mc_remaining_time;
    let hours = Math.floor(minutes / 60);
    minutes -= hours * 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
});
</script>

<template>
    <local-job class="box" >
        <local-ams-status><h1>AMS</h1><span>{{ AmsStatus2String(bambuMonitorClient.Status.value.ams_status, true) }}</span></local-ams-status>
        <local-rfid-status><h1>RFID</h1><span>{{ AmsRfidStatus[bambuMonitorClient.Status.value.ams_rfid_status] }}</span></local-rfid-status>
        <local-nozzle><h1>Nozzle</h1><span>{{ bambuMonitorClient.Status.value.nozzle_type }} {{ bambuMonitorClient.Status.value.nozzle_diameter }}mm</span></local-nozzle>
        <local-sdcard><h1>SD card</h1><span> {{  SdCardState[bambuMonitorClient.SdCardState.value] }}</span></local-sdcard>
        <local-home><h1>Axis home</h1>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_x_axis_home)">X</span>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_y_axis_home)">Y</span>
            <span v-if="bambuMonitorClient.HomeFlag.value.has(HomeFlag.is_z_axis_home)">Z</span>
        </local-home>
    </local-job>
</template>

<style scoped>
local-job
{
    display: grid;
    grid-template-areas: "ams-status     nozzle"
                         "rfid-status    sdcard"
                         "home           .";
    grid-template-columns: auto auto;
    grid-template-rows: 1rem 1rem;
    gap: 0.1rem 1rem;
}
local-ams-status
{
    grid-area: ams-status;
    display: flex;
    justify-content: space-between;
}
local-rfid-status
{
    grid-area: rfid-status;
    display: flex;
    justify-content: space-between;
}
local-nozzle
{
    grid-area: nozzle;
    display: flex;
    justify-content: space-between;
}
local-sdcard
{
    grid-area: sdcard;
    display: flex;
    justify-content: space-between;
}
local-home
{
    grid-area: home;
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
