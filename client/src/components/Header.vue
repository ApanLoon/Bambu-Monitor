<script setup lang="ts">
import { inject, computed } from "vue";
import { useRouter } from "vue-router";
import { useKeycloak } from "@josempgon/vue-keycloak";
import { type IBambuMonitorClient} from "@/plugins/IBambuMonitorClient";
import IconLogo from "./icons/IconLogo.vue";
import IconLogout from "./icons/IconLogout.vue";
import Checked from "./generic/Checked.vue";
import Job from "./JobHeader.vue";

const router = useRouter();
const { keycloak, isAuthenticated, decodedToken } = useKeycloak();

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[Header] Setup: No BambuMonitorClient plugin found.");
}

const isConnected = computed<boolean>(() => bambuMonitorClient.IsConnected.value && bambuMonitorClient.IsPrinterConnected.value );
</script>

<template>
  <div>
    <local-header>
      <local-app-logo><IconLogo></IconLogo></local-app-logo>
      <local-app-title>Bambu Monitor</local-app-title>
      <local-backend-connected><Checked :isChecked="bambuMonitorClient.IsConnected.value">Backend</Checked></local-backend-connected>
      <local-printer-connected><Checked :isChecked="bambuMonitorClient.IsPrinterConnected.value">Printer</Checked><local-dim-overlay v-if="!isConnected"></local-dim-overlay></local-printer-connected>
      <local-user-name v-if="isAuthenticated">{{ decodedToken.given_name }} {{ decodedToken.family_name }} <button @click="keycloak?.logout()"><IconLogout></IconLogout></button></local-user-name>
      <local-job :class="{ dimmed : isConnected }"><Job></Job><local-dim-overlay v-if="!isConnected"></local-dim-overlay></local-job>
    </local-header>
    <nav>
        <RouterLink to="/">Handy</RouterLink>
        <RouterLink to="/history">History</RouterLink>
        <RouterLink to="/debug">Debug</RouterLink>
        <RouterLink to="/log">Log</RouterLink>
        <local-filler></local-filler>
    </nav>
  </div>
</template>

<style scoped>
local-header
{
  display: grid;
  grid-template-areas: "app-logo app-title         job"
                       "app-logo backend-connected job"
                       "app-logo printer-connected job"
                       "app-logo user-name         job";
  grid-template-columns: auto 8rem 1fr;
  grid-template-rows: 1.5rem 1.2rem 1.2rem 1.2rem;
}

local-app-logo
{
  grid-area: app-logo;
}
local-app-title
{
  grid-area: app-title;
  font-size: 1rem;
  color: var(--color-text-highlight);
  margin-top: -0.25rem; /* TODO: This is sensitive to the font-family */
}
local-backend-connected
{
  grid-area: backend-connected;
}
local-user-name
{
    grid-area: user-name;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}
local-user-name button
{
  background: transparent;
  border: none;
  padding: 0;
  color: var(--color-text);
  align-self: center;
}
local-printer-connected
{
  grid-area: printer-connected;
  position: relative;
}
local-job
{
  grid-area: job;
  position: relative;
}
local-dim-overlay
{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--color-background);
  opacity: 0.8;
}

nav
{
  margin-top: 1rem;
  display: grid;
  grid-template-columns: auto auto auto auto auto 1fr;
}

nav > a
{
  border: 1px solid var(--color-border);
  border-radius: 0.3rem 0.3rem 0% 0%;
  color: var(--color-text-mute);
}

.router-link-active
{
  border-bottom: none;
  color: var(--color-text-highlight);
}

local-filler::after
{
  content: "";
  display: inline-block;
  width: 100%;
  height: 100%;
  border-bottom: 1px solid var(--color-border);
}
</style>
