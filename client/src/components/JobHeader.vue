<script lang="ts" setup>
import { inject, computed } from "vue";
import type { IBambuMonitorClient } from "../plugins/IBambuMonitorClient";
import { GCodeState, Stage } from "../../../server/src/shared/BambuMessages";
import { AmsStatus2String } from "../../../server/src/shared/BambuAmsTypes";
import type { Job } from "../../../server/src/shared/Job";

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

const status = computed<string>(() => 
{
  let stage = Stage[bambuMonitorClient.Status.value.stg_cur];
  let ams_status = AmsStatus2String(bambuMonitorClient.Status.value.ams_status, true);
  if (ams_status !== "")
  {
    ams_status = ` (${ams_status})`;
  }
  return `${stage}${ams_status}`;
});

// TODO: Move the thumbnail function somewhere to remove the need to duplicate it in the History page.
const thumbnail = (job : Job) =>
{
    return job.Project?.ThumbnailFile ? job.Project?.ThumbnailFile : "DefaultProjectThumbnail.png";
}

const toTenPercent = (value : number, max : number, min : number = 0 ) => Math.round(((value - min) / (max - min)) * 10 ) * 10;
</script>

<template>
    <local-job class="box" v-if="bambuMonitorClient.CurrentJob.value != null && bambuMonitorClient.Status.value !== undefined">
        <local-job-image>
            <img :src="thumbnail(bambuMonitorClient.CurrentJob.value)" alt="Project Image" />
        </local-job-image>
        <local-job-name>{{ bambuMonitorClient.CurrentJob.value.Name }}</local-job-name>
        <local-job-profile>{{ bambuMonitorClient.CurrentJob.value.Project?.SettingsName }}</local-job-profile>
        <local-job-layers><h1>Current layer</h1><span>{{ bambuMonitorClient.Status.value.layer_num }}/{{ bambuMonitorClient.Status.value.total_layer_num }}</span></local-job-layers>
        <local-job-progress-bar>
            <progress :value="bambuMonitorClient.Status.value.mc_percent" min="0" max="100"></progress>
            <local-job-progress-text>{{bambuMonitorClient.Status.value.mc_percent}}%</local-job-progress-text>
        </local-job-progress-bar>
        <local-job-status>{{ status }}</local-job-status>
        <local-job-remaining-time><h1>Remaining time</h1><span>-{{ RemainingTime }}</span></local-job-remaining-time>
    </local-job>
</template>

<style scoped>
local-job
{
    display: grid;
    grid-template-areas: "image name           name"
                         "image profile        layers"
                         "image progress-bar   progress-bar"
                         "image status         remaining-time";
    grid-template-columns: auto 1fr auto;
    grid-template-rows: 1.5rem 1rem 1.5rem 1rem;

}

local-job-image
{
    grid-area: image;
    aspect-ratio: 1 / 1;
    height: 100%;
}
img
{
  display: block;
  width: 90%;
  justify-self: center;
}

local-job-name
{
    grid-area: name;
    color: var(--color-text-highlight);
    font-size: 1rem;
    margin-top: -0.25rem; /* TODO: This is sensitive to the font-family */
}
local-job-profile
{
    grid-area: profile;
}
local-job-layers
{
    grid-area: layers;
    display: flex;
    justify-content: space-between;
}
local-job-progress-text
{
    position: absolute;
    left: 50%;
    color: contrast-color(var(--color-on));
}
local-job-progress-bar
{
    grid-area: progress-bar;
    width: 100%;
    position: relative;
    display: flex;
    align-items: center;
}
local-job-status
{
    grid-area: status;
    align-self: center;
}
local-job-remaining-time
{
    grid-area: remaining-time;
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

progress
{
  border: 1px solid var(--color-border);
  border-radius: 0.5rem; 
  width: 100%;
  height: 1.1rem;
}
progress::-webkit-progress-bar
{
  background-color: var(--color-background);
  border-radius: 0.5rem;
}
progress::-webkit-progress-value
{
  background-color: var(--color-on);
  border-radius: 0.5rem;
}
</style>
