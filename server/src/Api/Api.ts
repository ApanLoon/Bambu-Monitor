
import https from "node:https";
import WebSocket, { WebSocketServer } from "ws";
import { EventEmitter } from "node:events";
import { Connection, ConnectionCollection, ConnectionEvent } from "./ConnectionCollection.js";
import { Logger } from "../Logger/Logger.js";
import { LogLevel } from "../shared/LogLevel.js";
import { Job } from "../shared/Job.js";
import { BambuMonitorClientMessage, BambuMonitorServerMessage } from "../shared/BambuMonitorApi.js";

export class ApiOptions
{
    public Logger? : Logger;
    public HttpsServer? : https.Server;
}

export const ApiEvent = Object.freeze (
{
    GetState:           "getstate",
    SetLight:           "setlight",
    GetPrinterLogLevel: "getprinterloglevel",
    SetPrinterLogLevel: "setprinterloglevel",
    RequestFullLog:     "requestfulllog",
    RequestJobHistory:  "requestjobHistory"
});
    

export class Api extends EventEmitter
{
    private options : ApiOptions = new ApiOptions;
    private connections : ConnectionCollection = new ConnectionCollection;
    private socketServer? : WebSocketServer;

    public constructor(options : Partial<ApiOptions>)
    {
        super();

        Object.assign(this.options, options);

        if (this.options.HttpsServer === undefined )
        {
            this.options.Logger?.Log("Api requires an https server.");
            return;
        }
        this.socketServer = new WebSocketServer({noServer: true});
        this.options.HttpsServer.on("upgrade", (request, socket, head) =>
        {
            if (request.url === undefined)
            {
                return;
            }

            const { pathname } = new URL(request.url, 'wss://do.not.care');

            if (pathname === "/api")
            {
                this.socketServer?.handleUpgrade(request, socket, head, socket => this.onConnection(socket, this));
            }
        });
    }

    private onConnection (socket : WebSocket, self : Api)
    {
        let connection = new Connection(socket, (data : string) =>
        {
            const msg = JSON.parse(data);
            switch (msg.Type)
            {
                case BambuMonitorServerMessage.GetState:           self.emit(ApiEvent.GetState);                       break;
                case BambuMonitorServerMessage.SetLight:           self.emit(ApiEvent.SetLight, msg.isOn);             break;
                case BambuMonitorServerMessage.GetPrinterLogLevel: self.emit(ApiEvent.GetPrinterLogLevel);             break;
                case BambuMonitorServerMessage.SetPrinterLogLevel: self.emit(ApiEvent.SetPrinterLogLevel, msg.Level);  break;
                case BambuMonitorServerMessage.RequestFullLog:     self.emit(ApiEvent.RequestFullLog);                 break;
                case BambuMonitorServerMessage.RequestJobHistory:  self.emit(ApiEvent.RequestJobHistory);              break;
            }
        },
        (_event: any, connection: Connection) =>
        {
            //this.options.Logger?.Log (`[Api] Client disconnected. (${connection.id})`);
            self.connections.remove(connection);
        });

        //this.options.Logger?.Log(`[Api] Client connected. (${connection.id})`);
        connection.on(ConnectionEvent.LostHeartbeat, ()=>
        {
            console.log("Lost Heartbeat: api");
            self.connections.remove (connection);
        });

        self.connections.add(connection);
    }
    sendStatus (status : any )
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.Status,
            Status: status
        }));
    }

    sendPrinterConnectionStatus(isConnected : boolean)
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.PrinterConnectionStatus,
            IsConnected: isConnected
        }));
    }

    sendPrinterLogLevel(level : LogLevel)
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.PrinterLogLevel,
            Level: level
        }));
    }

    sendLogMessage(message : string)
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.MessageLogged,
            Message: message
        }));    
    }

    sendCurrentJob (job : Job | null)
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.CurrentJob,
            Job: job
        }));                
    }
    
    sendJobHistory (jobs : Array<Job> | null)
    {
        this.connections.sendToAll(JSON.stringify(
        {
            Type: BambuMonitorClientMessage.JobHistory,
            Jobs: jobs ?? []
        }));                
    }
}
