<script setup lang="ts">
import { inject } from "vue";
import { useRouter } from "vue-router";
import { useKeycloak } from "@josempgon/vue-keycloak";
import { type IBambuMonitorClient} from "@/plugins/IBambuMonitorClient";
import IconLogo from "./icons/IconLogo.vue";
import IconLogout from "./icons/IconLogout.vue";
import Job from "./JobHeader.vue";

const router = useRouter();
const { keycloak, isAuthenticated, decodedToken } = useKeycloak();

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[Header] Setup: No BambuMonitorClient plugin found.");
}
</script>

<template>
  <div>
    <local-header>
      <local-app-logo><IconLogo></IconLogo></local-app-logo>
      <local-app-title>Bambu Monitor</local-app-title>
      <local-backend-connected>Backend is {{ bambuMonitorClient.IsConnected.value === true ? "" : "not" }} connected</local-backend-connected>
      <local-user-name v-if="isAuthenticated">{{ decodedToken.given_name }} {{ decodedToken.family_name }} <button @click="keycloak?.logout()"><IconLogout></IconLogout></button></local-user-name>
      <local-printer-connected>Printer is {{ bambuMonitorClient.IsPrinterConnected.value === true ? "" : "not" }} connected</local-printer-connected>
      <local-job><Job></Job></local-job>
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
  margin-top: -0.25rem; /* TODO: This is sensitive to the font-family */
}
local-backend-connected
{
  grid-area: backend-connected;
}
local-user-name
{
  grid-area: user-name;
}
local-user-name button
{
  background: transparent;
  border: none;
  color: var(--color-text);
  align-self: center;
}
local-printer-connected
{
  grid-area: printer-connected;
}
local-job
{
  grid-area: job;
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
