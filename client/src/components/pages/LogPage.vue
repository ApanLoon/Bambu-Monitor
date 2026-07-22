<script lang="ts" setup>
import { inject, computed } from "vue";
import type { IBambuMonitorClient } from "../../plugins/IBambuMonitorClient";
import { LogLevel } from "../../../../server/src/shared/LogLevel";
import StyledSelect from "../generic/StyledSelect.vue";

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[LogPage] Setup: No BambuMonitorClient plugin found.");
}

const LogLevelString = computed<string>(() => LogLevel[bambuMonitorClient.LogLevel.value]);
const LogLevels = computed(()=>Object.keys(LogLevel).filter(x => isNaN(Number(x)) === true));

const selectLogLevel = function (selected : string)
{
  const level : LogLevel = (<any>LogLevel)[selected];
  bambuMonitorClient.SetPrinterLogLevel(level);
}
</script>

<template>
    <local-container>
        <local-log-level>Log level: <StyledSelect :options="LogLevels" :default="LogLevelString" @change="selectLogLevel"></StyledSelect></local-log-level>
        <local-log>
            <local-logmessage v-for="message in bambuMonitorClient.Log.value">
                <pre>{{ message }}</pre>
            </local-logmessage>
        </local-log>
    </local-container>
</template>

<style scoped>
local-container
{
    display: grid;
    grid-template-rows: auto 1fr;
    height: 100%;
    padding-top: 0.5rem;
}
local-log
{
    border-top: 1px solid var(--color-border);
    display: block;
    overflow-y: auto;
    height: 100%;
}
local-logmessage
{
    display: block;
    font-family: Consolas, 'Courier New', monospace;
}
</style>
