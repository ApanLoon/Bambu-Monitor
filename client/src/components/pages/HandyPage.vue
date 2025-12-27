<script lang="ts" setup>
import { inject, computed } from "vue";
import type { IBambuMonitorClient } from "../../plugins/IBambuMonitorClient";
import { GCodeState, Stage } from "../../../../server/src/shared/BambuMessages";

import SafetyButton from "../generic/SafetyButton.vue"

import IconAms from "../icons/IconAms.vue";
import IconHumidity from "../icons/IconHumidity.vue";

import Camera from "../Camera.vue";
import Thermometer from "../generic/Thermometer.vue"

import FilamentTray from "../ams/FilamentTray.vue"
import type { Job } from "../../../../server/src/shared/Job";

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[StatusPage] Setup: No BambuMonitorClient plugin found.");
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
  
  return `${Stage[bambuMonitorClient.Status.value.stg_cur]} (${bambuMonitorClient.Status.value.gcode_state})`;
});

// TODO: Move the thumbnail function somewhere to remove the need to duplicate it in the History page.
const thumbnail = (job : Job) =>
{
    return job.Project?.ThumbnailFile ? job.Project?.ThumbnailFile : "DefaultProjectThumbnail.png";
}

const toTenPercent = (value : number, max : number, min : number = 0 ) => Math.round(((value - min) / (max - min)) * 10 ) * 10;

const pauseJob = () =>
{
  bambuMonitorClient.RequestPauseJob();
}
const resumeJob = () =>
{
  bambuMonitorClient.RequestResumeJob();
}
const stopJob = () =>
{
  bambuMonitorClient.RequestStopJob();
}
</script>

<template>
  <local-container v-if="bambuMonitorClient.IsConnected.value === true && bambuMonitorClient.IsPrinterConnected.value === true">
    <Camera></Camera>
    <local-job class="box" v-if="bambuMonitorClient.CurrentJob.value != null && bambuMonitorClient.CurrentJob.value.Project != null && bambuMonitorClient.Status.value !== undefined">
      <local-job-image>
        <img :src="thumbnail(bambuMonitorClient.CurrentJob.value)" alt="Project Image" />
      </local-job-image>
      <local-job-name>{{ bambuMonitorClient.CurrentJob.value.Name }}</local-job-name>
      <local-job-profile>{{ bambuMonitorClient.CurrentJob.value.Project.SettingsName }}</local-job-profile>
      <local-job-layers><h1>Printed layers</h1><span>{{ bambuMonitorClient.Status.value.layer_num }}/{{ bambuMonitorClient.Status.value.total_layer_num }}</span></local-job-layers>
      <local-job-progress-text><h1>{{bambuMonitorClient.Status.value.mc_percent}}%</h1><span>-{{ RemainingTime }}</span></local-job-progress-text>
      <local-job-progress-bar><progress :value="bambuMonitorClient.Status.value.mc_percent" min="0" max="100"></progress></local-job-progress-bar>
      <local-job-status>{{ status }}</local-job-status>
      <local-job-actions></local-job-actions>
    </local-job>

    <local-job-control-panel><!-- TODO: Move this into the local-job container to hide it when there is no job running -->
      <template v-if="bambuMonitorClient.Status.value.gcode_state === GCodeState.Running || bambuMonitorClient.Status.value.gcode_state === GCodeState.Prepare">
        <SafetyButton @click="pauseJob"  label="Pause"  name="pause-button"  circle noanimate></SafetyButton>
      </template>
      <template v-if="bambuMonitorClient.Status.value.gcode_state === GCodeState.Pause">
        <SafetyButton @click="resumeJob" label="Resume" name="resume-button" circle noanimate></SafetyButton>
        <SafetyButton @click="stopJob"   label="Stop"   name="stop-button"   circle noanimate></SafetyButton>
      </template>
    </local-job-control-panel>

    <local-device v-if="bambuMonitorClient.Status.value !== undefined">
      <local-temperature class="box">
        <div>
            <h2>Nozzle</h2>
            <Thermometer :currentValue="Number(bambuMonitorClient.Status.value.nozzle_temper)" :targetValue="Number(bambuMonitorClient.Status.value.nozzle_target_temper)" :valueMin="0" :valueMax="300"></Thermometer>
        </div>
        <div>
            <h2>Bed</h2>
            <Thermometer :currentValue="Number(bambuMonitorClient.Status.value.bed_temper)" :targetValue="Number(bambuMonitorClient.Status.value.bed_target_temper)" :valueMin="0" :valueMax="250"></Thermometer>
        </div>
        <div>
            <h2>Chamber</h2>
            <Thermometer :currentValue="Number(bambuMonitorClient.Status.value.chamber_temper)" :valueMin="0" :valueMax="60"></Thermometer>
        </div>
      </local-temperature>
      <local-fan class="box">
        <div>
          <h2>Chamber fan</h2>
          {{ toTenPercent(Number(bambuMonitorClient.Status.value.big_fan2_speed), 15, 0) }}%
        </div>
        <div>
          <h2>Cooling fan</h2>
          {{ toTenPercent(Number(bambuMonitorClient.Status.value.cooling_fan_speed), 15, 0) }}%
        </div>
        <div v-if="bambuMonitorClient.Status.value.aux_part_fan === true">
          <h2>Aux fan</h2>
          {{ toTenPercent(Number(bambuMonitorClient.Status.value.big_fan1_speed), 15, 0) }}%
        </div>
      </local-fan>
      <local-ams class="box" v-for="ams in bambuMonitorClient.Status.value.ams.ams">
        <local-ams-name><IconAms class="icon-ams"></IconAms>{{ ams.id }}</local-ams-name>
        <local-ams-humidity><IconHumidity :fill="(5 - Number(ams.humidity)) / 5"></IconHumidity></local-ams-humidity>
        <local-ams-filaments>
          <FilamentTray v-for="tray in ams.tray" :amsId="Number(ams.id)" :tray="tray" :currentTrayId="Number(bambuMonitorClient.Status.value.ams.tray_now)"></FilamentTray>
        </local-ams-filaments>
      </local-ams>
      <local-ams class="box">
        <local-ams-name>External spool</local-ams-name>
        <local-ams-humidity></local-ams-humidity>
        <local-ams-filaments>
          <FilamentTray :amsId="0" :tray="bambuMonitorClient.Status.value.vt_tray" :currentTrayId="Number(bambuMonitorClient.Status.value.ams.tray_now)"></FilamentTray>
        </local-ams-filaments>
      </local-ams>
    </local-device>
<!--
    <template v-if="bambuMonitorClient.IsConnected.value && bambuMonitorClient.IsPrinterConnected.value && bambuMonitorClient.Status.value !== undefined && bambuMonitorClient.CurrentJob.value != null && bambuMonitorClient.CurrentJob.value.Project != null ">
        <img :src="bambuMonitorClient.CurrentJob.value.Project?.ThumbnailFile" alt="Project Image" />
        <local-itemised-list>
          <local-item-name>Plate</local-item-name> <local-item-value>{{ bambuMonitorClient.CurrentJob.value.Project.PlateName }} (Index: {{ bambuMonitorClient.CurrentJob.value.Project.PlateIndex }})</local-item-value>
          <local-item-name>Profile</local-item-name> <local-item-value>{{ bambuMonitorClient.CurrentJob.value.Project.SettingsName }}</local-item-value>
          <local-item-name>Total filament weight</local-item-name> <local-item-value>{{ bambuMonitorClient.CurrentJob.value.Project.TotalWeight }}g</local-item-value>
        </local-itemised-list>

        <div v-for="filament in bambuMonitorClient.CurrentJob.value.Project.Filaments">
          <local-filament :style="{'background-color': filament.Colour}">
            <local-filament-text>
              <div>{{ filament.Type }}</div>
              <div>{{ filament.UsedLength }}m</div>
              <div>{{ filament.UsedWeight }}g</div>
            </local-filament-text>
          </local-filament>
        </div>
    </template>
    -->
  </local-container>
</template>

<style scoped>
local-container
{
  justify-items: center;
}

local-job
{
  display: grid;
  grid-template-areas: "image name"
                       "image profile"
                       "image status"
                       "image layers"
                       "image progress-text"
                       "image progress-bar"
                       " -    actions";
  grid-template-columns: 40% auto;
}

local-job-image
{
  grid-area: image;
  aspect-ratio: 1 / 1;
}

local-job-name
{
  color: var(--color-text-highlight);
  font-size: 1rem;
}
local-job-layers
{
  display: flex;
  justify-content: space-between;
  font-size: 1rem;
}
local-job-layers h1
{
  color: var(--color-text-highlight);
    font-size: 1rem;
  margin: 0;
  padding: 0;
}
local-job-progress-text
{
  display: flex;
  justify-content: space-between;
  align-items: end;
  font-size: 1rem;
}
local-job-progress-text h1
{
  font-size: 1.5rem;
}

local-job-status
{
  align-self: center;
  font-size: 1rem;
}
local-job-actions
{
  height: 1rem;
}

local-job-control-panel
{
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

local-temperature
{
  display: flex;
  justify-content: space-between;
}

local-fan
{
  display: flex;
  justify-content: space-between;
}

local-ams
{
  display: grid;
  grid-template-areas: "name humidity"
                       "filaments filaments";
}

.icon-ams
{
  width: auto;
  height: 0.33rem;
  padding-right: 0.33rem;
}

local-ams-humidity
{
  padding-top: 0.33rem;
  justify-self: right;
}
local-ams-filaments
{
  grid-area: filaments;
  display: grid;
  grid-auto-flow: column;
  padding-bottom: 1rem;
}

.box
{
  margin-top: 1rem;
  padding-left: 1rem;
  padding-right: 1rem;
  border: 1px solid var(--color-border);
}

.box div h2
{
  justify-self: center;
}

h1
{
  display: inline;
}

progress
{
  border: 1px solid var(--color-border);
  border-radius: 0.5rem; 
  width: 100%;
  height: 1rem;
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

img
{
  display: block;
  width: 90%;
  justify-self: center;
}

/*

local-itemised-list
{
  display: grid;
  grid-template-columns: 1fr 1fr;
}
local-item-name
{
  justify-self: left;
}
local-item-value
{
  justify-self: right;
}

local-filament
{
  display: inline-block;
  border: 1px solid var(--color-border);
  padding: 1rem;
}
local-filament-text
{
    color: white;
    filter:  brightness(.7);
    mix-blend-mode: difference;
    text-align: center;
}
*/
</style>
