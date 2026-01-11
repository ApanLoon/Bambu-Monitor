<script lang="ts" setup>
import { inject, onMounted } from "vue";
import type { IBambuMonitorClient } from "../../plugins/IBambuMonitorClient";
import { JobState, type Job } from "../../../../server/src/shared/Job";
import StringInput from "../generic/StringInput.vue";

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[HistoryPage] Setup: No BambuMonitorClient plugin found.");
}

const status = (job : Job ) =>
{
    switch (job.State)
    {
        case JobState.Failed:
            return "Failure";
        case JobState.Finished:
            return "Success";
        case JobState.Started:
            return "Pending";
        default:
            return "Unknown state";
    }
}

// TODO: Move the thumbnail function somewhere to remove the need to duplicate it in the Handy page.
const thumbnail = (job : Job) =>
{
    return job.Project?.ThumbnailFile ? job.Project?.ThumbnailFile : "DefaultProjectThumbnail.png";
}

const duration = (job : Job) =>
{
    if (job.StopTime == null )
    {
        return "?";
    }
    let diff = (job.StopTime.getTime() - job.StartTime.getTime()) / 1000 / 60; // Minutes
    if (diff < 60)
    {
        return `${round(diff, 2)} minutes`;
    }

    diff /= 60; // Hours
    if (diff < 24)
    {
        return `${round(diff, 2)} hours`;
    }

    diff /= 24; // Days
    return `${round(diff, 2)} days`;
}

const round = (value: number, places : number) =>
{
    const multiplier = Math.pow(10, places);
    return (Math.round ((value + Number.EPSILON) * multiplier) / multiplier); 
}

const saveComment = (jobId: string, newComment : string) =>
{
    bambuMonitorClient.SaveJobComment(jobId, newComment);
}

const saveRecipient = (jobId: string, newRecipient : string) =>
{
    bambuMonitorClient.SaveJobRecipient(jobId, newRecipient);
}
</script>

<template>
  <local-container>
    <local-job v-for="job in bambuMonitorClient.JobHistory.value">
        <local-image><img :src="thumbnail(job)" alt="Project Image" /></local-image>
        <local-state :class="{
            pending:  job.State === JobState.Started,
            success:  job.State === JobState.Finished,
            fail:     job.State === JobState.Failed
        }">{{ status(job) }}</local-state>
        <local-recipient><StringInput :rightAlign="true" :value="job.Recipient" @change="newRecipient => saveRecipient(job.Id, newRecipient)"></StringInput></local-recipient>
        <local-name>{{ job.Name }}</local-name>
        <local-comment><StringInput :multiLine="true" :value="job.Comment" @change="newComment => saveComment(job.Id, newComment)"></StringInput></local-comment>
        <local-filaments>
            <local-filament v-for="filament in job.Project?.Filaments" :style="{'--filament-colour': filament.Colour }">
                {{ filament.BrandFamily }}: {{ filament.UsedWeight }}g
            </local-filament>
        </local-filaments>
        <local-duration>{{  duration(job) }}</local-duration>
        <local-total-weight>{{ job.Project?.TotalWeight }}g</local-total-weight>
        <local-plate>{{ job.Project?.PlateName }}</local-plate>
        <local-start>{{ job.StartTime.toLocaleString() }}</local-start>
    </local-job>
  </local-container>
</template>

<style scoped>
local-container
{
    justify-items: center;
}

.pending
{
    background-color: var(--color-pending);
}
.success
{
    background-color: var(--color-on);
}
.fail
{
    background-color: var(--color-error);
}

local-job
{
    display: grid;
    grid-template-areas: "img state    recipient"
                         "img name     name"
                         "img comment  comment"
                         "img filament filament"
                         "img duration total-weight"
                         "img plate    start"
                         ;
    grid-template-columns: 20% auto auto;
    grid-template-rows: auto auto 1fr auto auto auto;

    padding-top: 0.5rem;
    margin-right: 1rem;
    border-top: 1px solid var(--color-border);
    overflow: auto;
}

local-image
{
    grid-area: img;
    aspect-ratio: 1 / 1;
}
local-image > img
{
    width: 100%;
    height: 100%;
}

local-state
{
    grid-area: state;
    margin-left: 0;
    margin-right: auto;
    padding: 0 0.5rem;
    border-radius: 2rem;
    color: var(--color-text-highlight);
}
local-recipient
{
    grid-area: recipient;
}
local-name
{
    grid-area: name;
    font-size: 1rem;
}
local-comment
{
    grid-area: comment;
}
local-filaments
{
    grid-area: filament;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}
local-filament
{
    text-wrap: nowrap;
    display: inline;
    
    &::before
    {
        content: "";
        display: inline-block;
        width: 1rem;
        height: 1rem;
        background-color: var(--filament-colour);
        border: 1px solid var(--color-border);
        vertical-align: -25%;
        margin-right: 0.5rem;
    }
}

local-duration
{
    grid-area: duration;
}
local-total-weight
{
    grid-area: total-weight;
    justify-self: right;
}
local-plate
{
    grid-area: plate;
}
local-start
{
    grid-area: start;
    justify-self: right;
}
</style>
