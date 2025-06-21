import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from "node:fs";

import { defineConfig, PluginOption } from 'vite';
import vue from '@vitejs/plugin-vue';
import {DynamicPublicDirectory} from "vite-multiple-assets";

// https://vitejs.dev/config/
export default defineConfig (( { mode } ) =>
{
  let publicDirectories : Array<any> = ["public/**"];

  if ( mode === 'development' )
  {
    publicDirectories.push (
      {
        input: "../server/projectArchive/**",
        output: "/projectArchive",
        watch: false
      });
  }
  
  return {
    plugins:
    [
      vue (
      {
        template:
        {
          compilerOptions:
          {
            isCustomElement: tag => tag.startsWith("local-")
          }
        }
      }) as PluginOption,

      DynamicPublicDirectory
      (
        publicDirectories,
        {
          ssr: false,
          ignore: []
        }) as PluginOption
    ],

    publicDir: false, // This is instead handled by the "vite-multiple-assets" plugin

    resolve:
    {
      alias:
      {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    build:
    {
      outDir: '../server/dist/wwwroot'
    },

    server:
    {
      https:
      {
        "key":  readFileSync("../server/certificates/privatekey.pem"),
        "cert": readFileSync("../server/certificates/certificate.pem")
      },
      proxy:
      {
        "/api":
        {
          target: "wss://localhost:5005",
          changeOrigin: true,
          ws: true,
          secure: false
        },
        "/camera":
        {
          target: "wss://localhost:5005",
          changeOrigin: true,
          ws: true,
          secure: false
        }
      }
    }
  }
});
