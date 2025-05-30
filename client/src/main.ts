import './assets/main.css'

import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';

import BambuMonitorClientPlugin from './plugins/BambuMonitorClientPlugin'

import StatusPage from "./components/pages/StatusPage.vue";
import CameraPage from "./components/pages/CameraPage.vue";
import HandyPage from "./components/pages/HandyPage.vue";
import HistoryPage from "./components/pages/HistoryPage.vue";
import LogPage from "./components/pages/LogPage.vue";

const routes =
[
    { path: "/",        component: StatusPage  },
    { path: "/camera",  component: CameraPage  },
    { path: "/handy",   component: HandyPage   },
    { path: "/history", component: HistoryPage },
    { path: "/log",     component: LogPage     }
];

console.log("[main] Getting config...");
fetch ("config.json")
.then (response =>
{
    if (!response.ok)
    {
        throw new Error (`${response.status} ${response.statusText}`);
    }

    response.json()
    .then (config =>
    {
        const router = createRouter(
            {
                history: createWebHistory(),
                routes
            }
        );
        
        const app = createApp(App);
        app.use(BambuMonitorClientPlugin, config);
        app.use(router);
        app.mount("#app");
    })
    .catch(error =>
    {
        console.log ("[main] Unable to get config. ", error);
    });
})
.catch(error=>
{
    console.log ("[main] Unable to get config. ", error);
});
