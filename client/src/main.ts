import './assets/main.css'

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { vueKeycloak, useKeycloak } from '@josempgon/vue-keycloak'
import App from './App.vue';

import BambuMonitorClientPlugin from './plugins/BambuMonitorClientPlugin'

import StatusPage from "./components/pages/StatusPage.vue";
import CameraPage from "./components/pages/CameraPage.vue";
import HandyPage from "./components/pages/HandyPage.vue";
import HistoryPage from "./components/pages/HistoryPage.vue";
import LogPage from "./components/pages/LogPage.vue";
import type { BambuMonitorClientOptions } from './plugins/BambuMonitorClient';
 
const routes =
[
    { path: "/",        component: StatusPage  },
    { path: "/camera",  component: CameraPage  },
    { path: "/handy",   component: HandyPage   },
    { path: "/history", component: HistoryPage },
    { path: "/log",     component: LogPage     }
];

const app = createApp(App);

await vueKeycloak.install(app,
{
    config:
    {
        url: import.meta.env.VITE_KEYCLOAK_URL,
        realm: import.meta.env.VITE_KEYCLOAK_REALM,
        clientId: import.meta.env.VITE_KEYCLOAK_CLIENT,
    },
    initOptions:
    {
        onLoad: "login-required"
    }
});

const url = new URL(window.location.href);
app.use(BambuMonitorClientPlugin, { Host: url.hostname, Port: Number(url.port) } as BambuMonitorClientOptions);
app.use(createRouter( { history: createWebHistory(), routes }));
app.mount("#app");
