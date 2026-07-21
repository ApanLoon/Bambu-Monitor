<script setup lang="ts">
import { inject, computed } from "vue";
import { useKeycloak } from "@josempgon/vue-keycloak";
import { type IBambuMonitorClient} from "@/plugins/IBambuMonitorClient";
import IconLogo from "./icons/IconLogo.vue";
import IconLogout from "./icons/IconLogout.vue";
import Checked from "./generic/Checked.vue";
import Job from "./JobHeader.vue";
import PrinterStatus from "./PrinterStatusHeader.vue"

const { keycloak, isAuthenticated, decodedToken } = useKeycloak();

const bambuMonitorClient = inject<IBambuMonitorClient>("BambuMonitorClient");
if (bambuMonitorClient === undefined)
{
  throw new Error ("[Header] Setup: No BambuMonitorClient plugin found.");
}
const isConnected = computed<boolean>(() => bambuMonitorClient.IsConnected.value && bambuMonitorClient.IsPrinterConnected.value );
const hasJob      = computed<boolean>(() => bambuMonitorClient.CurrentJob.value != null && bambuMonitorClient.Status.value !== undefined);
</script>

<template>
  <div>
    <local-header>
      <local-top-left>
        <local-app-logo>
          <IconLogo></IconLogo>
          <local-app-title>Bambu Monitor</local-app-title>
        </local-app-logo>       
        <local-backend-connected><Checked :isChecked="bambuMonitorClient.IsConnected.value">Backend</Checked></local-backend-connected>
        <local-printer-connected v-dim="!isConnected"><Checked :isChecked="bambuMonitorClient.IsPrinterConnected.value">Printer</Checked></local-printer-connected>
      </local-top-left>
      <local-top-right v-if="hasJob" v-dim="!isConnected"><Job></Job></local-top-right>
      <local-top-right v-else v-dim="!isConnected"><PrinterStatus></PrinterStatus></local-top-right>
    </local-header>

    <nav>
        <RouterLink to="/">Handy</RouterLink>
        <RouterLink to="/history">History</RouterLink>
        <RouterLink to="/debug">Debug</RouterLink>
        <RouterLink to="/log">Log</RouterLink>
        <local-user-name v-if="isAuthenticated">{{ decodedToken.given_name }} {{ decodedToken.family_name }} <button @click="keycloak?.logout()"><IconLogout></IconLogout></button></local-user-name>
    </nav>
  </div>
</template>

<style scoped>
local-header
{
  display: flex;
  gap: 1rem;
}

local-top-left
{
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  local-app-logo
  {
    display: flex;
    flex-direction: column;
    justify-self: left;
    align-self: start;

    local-app-title
    {
      font-size: 0.5rem;
      color: var(--color-text-highlight);
    }
  }
}

local-top-right
{
  flex: 1;
  position: relative;
}

local-user-name
{
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border);

    & button
  {
    background: transparent;
    border: none;
    padding: 0;
    color: var(--color-text);
    align-self: center;
  }
}

nav
{
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: auto auto auto auto 1fr;
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
</style>
