<script setup lang="ts">
import { inject, computed, type PropType } from "vue";
import type { IBambuMonitorClient } from "@/plugins/IBambuMonitorClient";
import type { Status } from "../../../../server/src/shared/BambuMessages";
import { AmsRfidStatus, AmsStatus2String, Tray } from "../../../../server/src/shared/BambuAmsTypes";
import BitDisplay from "../generic/BitDisplay.vue";
import IconAms from "../icons/IconAms.vue";
import IconBambuLab from "../icons/IconBambuLab.vue"
import IconSpool from "../icons/IconSpool.vue"

const props = defineProps(
{
  amsId: { type : Number, required : true },
  tray:  { type: Object as PropType<Tray>,  required: true },
  currentTrayId: { type: Number, required: true}
});

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[Ams] Setup: No BambuMonitorClient plugin found.");
}

const checkBit = (index : number, bitString : string) =>
{
    let mask = Math.pow(2, index);
    let bits = Number("0x" + bitString);
    return ((bits & mask) != 0);
}

const getIndex = () => Number(props.amsId) * 4 + Number(props.tray.id);

const isTrayReading = () =>
{
    let index = getIndex ();
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_reading_bits);
}
const isTrayRead = () =>
{
    let index = getIndex ();
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_read_done_bits) && isTrayReading() === false;
}
const isTrayEmpty = () =>
{
    let index = getIndex ();
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_exist_bits) == false;
}

const isBbl = () =>
{
    let index = getIndex ();
    return checkBit(index, bambuMonitorClient.Status.value.ams.tray_is_bbl_bits);
}
</script>

<template>
    <local-tray :class="{'tray-is-loaded': props.currentTrayId === Number(props.tray.id) }">
        <template v-if="isTrayReading()">
            <IconSpool class="icon-spool"></IconSpool>
        </template>
        <template v-if="isTrayEmpty()">
            <local-tray-text>
                <div>Empty</div>
            </local-tray-text>
        </template>
        <template  v-if="isTrayRead() && isTrayEmpty() === false">
            <local-tray-fill :style="{'background-color': '#' + props.tray.tray_color, 'height': props.tray.remain + '%' }"></local-tray-fill>
            <local-tray-text>
                <IconBambuLab v-if="isBbl()"></IconBambuLab>
                <div>{{ props.tray.tray_type }}</div>
                <div>{{ props.tray.remain }}%</div>
                <div>~{{ props.tray.remain / 100 * Number(props.tray.tray_weight) }}g</div>
            </local-tray-text>
        </template>
    </local-tray>
</template>

<style scoped>
local-tray
{
    border: 1px solid var(--color-border);
    position: relative;
    transform: translateY(-50%);
    top: 50%;
}

.icon-spool
{
    display: block;
    margin: auto;
    margin-top: 0.5rem; /* TODO: Centre this properly */
    animation: spin 5s linear infinite ;
}
@keyframes spin
{
  100% {transform: rotate(360deg);}
}

local-tray local-tray-text
{
    color: white;
    filter:  brightness(.7);
    mix-blend-mode: difference;
    text-align: center;
}

local-tray local-tray-text svg
{
    position: absolute;
    bottom: 0px;
    right: 0px;
    margin: 0.2rem;
}

local-tray local-tray-fill
{
    display: block;
    border-top: 1px solid var(--color-border);
    position: absolute;
    width: 100%;
    bottom: 0px;
    z-index: -10;
}

.tray-is-loaded
{
    border: 1px solid var(--color-on);
}
</style>
