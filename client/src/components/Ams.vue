<script setup lang="ts">
import { inject, computed } from "vue";
import type { IBambuMonitorClient } from "@/plugins/IBambuMonitorClient";
import type { Status } from "../../../server/src/shared/BambuMessages";
import { AmsRfidStatus, AmsStatus2String } from "../../../server/src/shared/BambuAmsTypes";
import BitDisplay from "./generic/BitDisplay.vue";
import IconAms from "./icons/IconAms.vue";
import IconBambuLab from "./icons/IconBambuLab.vue"
import IconSpool from "./icons/IconSpool.vue"
import FilamentTray from "./ams/FilamentTray.vue"

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[Ams] Setup: No BambuMonitorClient plugin found.");
}

const status = computed<Status> (() =>
{
    return bambuMonitorClient.Status.value;
});

const amsStatusString  = computed<string>(() => AmsStatus2String(bambuMonitorClient.Status.value.ams_status));
const rfidStatusString = computed<string>(() => AmsRfidStatus[bambuMonitorClient.Status.value.ams_rfid_status]);

const trayCount = computed<number> (() =>
{
    let n = 0;
    bambuMonitorClient.Status.value.ams.ams.forEach(ams =>
    {
        n += ams.tray.length;
    });
    return n;
});

const checkBit = (index : number, bitString : string) =>
{
    let mask = Math.pow(2, index);
    let bits = Number("0x" + bitString);
    return ((bits & mask) != 0);
}

const isTrayReading = (amsIndex : string, trayIndex : string) =>
{
    let index = Number(amsIndex) * 4 + Number(trayIndex);
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_reading_bits);
}
const isTrayRead = (amsIndex : string, trayIndex : string) =>
{
    let index = Number(amsIndex) * 4 + Number(trayIndex);
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_read_done_bits) && isTrayReading(amsIndex, trayIndex) === false;
}
const isTrayEmpty = (amsIndex : string, trayIndex : string) =>
{
    let index = Number(amsIndex) * 4 + Number(trayIndex);
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_exist_bits) == false;
}

const isBbl = (amsIndex : string, trayIndex : string) =>
{
    let index = Number(amsIndex) * 4 + Number(trayIndex);
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_is_bbl_bits);
}
</script>

<template>
    <local-ams>
        <local-ams-state>
            <local-header>
                <IconAms class="icon-ams"></IconAms>
                <h2>Status: {{ amsStatusString }}</h2>
                <h2>RFID: {{ rfidStatusString }}</h2>
            </local-header>
            
            <local-version>{{ status.ams.version }}</local-version>

            <h2 style="grid-area: units-header;">Units ({{ status.ams.ams.length }})</h2>
            <BitDisplay style="grid-area: units-exists" :lsbFirst="true" :bits="Number('0x' + status.ams.ams_exist_bits)"></BitDisplay>

            <h2 style="grid-area: trays-header">Trays ({{ trayCount }})</h2>

            <h2 style="grid-area: tray-exists-header">Exists:</h2>
            <BitDisplay style="grid-area: tray-exists" :lsbFirst="true" :bits="Number('0x' + status.ams.tray_exist_bits)"></BitDisplay>

            <h2 style="grid-area: tray-bbl-header">BBL:</h2>
            <BitDisplay style="grid-area: tray-bbl"     :lsbFirst="true" :bits="Number('0x' + status.ams.tray_is_bbl_bits)"></BitDisplay>

            <h2 style="grid-area: tray-reading-header">Reading:</h2>
            <BitDisplay style="grid-area: tray-reading" :lsbFirst="true" :bits="Number('0x' + status.ams.tray_reading_bits)" :minBits="trayCount">Reading:</BitDisplay>

            <h2 style="grid-area: tray-done-header">Done:</h2>
            <BitDisplay style="grid-area: tray-done"    :lsbFirst="true" :bits="Number('0x' + status.ams.tray_read_done_bits)"></BitDisplay>
        </local-ams-state>
        
        insert_flag: {{ status.ams.insert_flag }}
        power_on_flag: {{ status.ams.power_on_flag }}
        tray_now: {{ status.ams.tray_now }}
        tray_pre: {{ status.ams.tray_pre }}
        tray_tar: {{ status.ams.tray_tar }}
        

        <local-ams-instance v-for="ams in status.ams.ams">
            <div>
                <local-info><span>Id:</span><span>{{ ams.id }}</span></local-info>
                <local-info><span>Humidity:</span><span>{{ ams.humidity }}</span></local-info>
                <local-info><span>Temp:</span><span>{{ ams.temp }}&deg;</span></local-info>
            </div>
            <FilamentTray v-for="tray in ams.tray" :amsId="Number(ams.id)" :tray="tray" :currentTrayId="Number(bambuMonitorClient.Status.value.ams.tray_now)"></FilamentTray>
        </local-ams-instance>
    </local-ams>
</template>

<style scoped>
local-ams
{
    display: block;
    border: 1px solid var(--color-border);
    padding: 0.5rem;
    margin-top: 0.5rem;
}

local-ams-state
{
    display: grid;
    grid-template-areas:
      "logo         header             header       header              version"
      "units-header trays-header       trays-header trays-header        trays-header"
      "units-exists tray-exists-header tray-exists  tray-reading-header tray-reading"
      ".            tray-bbl-header    tray-bbl     tray-done-header    tray-done"
    ;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
    column-gap: 0.5rem;
    position: relative;
}

.icon-ams
{
    grid-area: logo;
    position: absolute;
    top: 0;
    left: 0;
    width: auto;
    height: 0.33rem;
}

local-header
{
    grid-area: header;
    display: flex;
    gap: 0.5rem;
}

local-version
{
    grid-area: version;
    position: absolute;
    top: 0;
    right: 0;
    font-size: 0.5rem;
}

local-ams-instance
{
    display: grid;
    grid-auto-flow: column;
}

local-info
{
    display: flex;
    justify-content: space-between;
    margin-right: 0.5rem;
}
</style>
