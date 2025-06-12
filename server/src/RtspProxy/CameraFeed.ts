import https from "node:https";
import WebSocket, { WebSocketServer } from "ws";
import { EventEmitter } from "node:events";
import { Connection, ConnectionCollection, ConnectionEvent } from "../Api/ConnectionCollection.js";
import { BambuClient } from "../BambuClient/BambuClient.js";
import { RtspProxy } from "./RtspProxy.js";

export class CameraFeedOptions
{
    public BambuClient  : BambuClient | null = null;
    public HttpsServer? : https.Server |undefined;
    public UserName     : string = "bblp";
    public Password     : string = "";
}

export class CameraFeed extends EventEmitter
{
    private _options : CameraFeedOptions = new CameraFeedOptions();

    private _socketServer : WebSocketServer | undefined;
    private _connections : ConnectionCollection = new ConnectionCollection;

    private static readonly STREAM_MAGIC_BYTES = "jsmp" // Must be 4 bytes

    private _rtspProxy : RtspProxy | undefined;
    private _width  : number = 0;
    private _height : number = 0;

    constructor (options : Partial<CameraFeedOptions>)
    {
        super();
        Object.assign(this._options, options);
        if (this._options.HttpsServer === undefined )
        {
            console.log("CameraFeed requires an https server.");
            return;
        }

        this._socketServer = new WebSocketServer({noServer: true});
        this._options.HttpsServer.on("upgrade", (request, socket, head) =>
        {
            if (request.url === undefined)
            {
                return;
            }

            const { pathname } = new URL(request.url, 'wss://do.not.care');

            if (pathname === "/camera")
            {
                this._socketServer?.handleUpgrade(request, socket, head, socket => this.onConnect(this, socket, request));
                return;
            }
        });
    }

    public Start(width : number, height : number)
    {
        this._width = width;
        this._height = height;
    }

    private onConnect(pipe : CameraFeed, socket : WebSocket, request : any)
    {
        //If there are zero connections, create the RtspProxy:
        if (this._connections.count() === 0 && this._options.BambuClient?.status.ipcam !== undefined && this._options.BambuClient?.status.ipcam.rtsp_url !== "" && this._rtspProxy === undefined)
        {
            this._rtspProxy = new RtspProxy(this._options.BambuClient?.status.ipcam.rtsp_url, this._options.UserName, this._options.Password, this);
        }

        let connection = new Connection(socket, (data : string) => { }, (_event: any, connection: Connection) => { this._connections.remove(connection); });
        connection.on(ConnectionEvent.LostHeartbeat, ()=>
        {
            console.log("Lost Heartbeat: ipcam");
            this._connections.remove (connection);
            connection.Close();

            //If there are zero connections left, destroy the RtspProxy:
            if (this._connections.count() === 0)
            {
                this._rtspProxy?.Stop();
                this._rtspProxy = undefined;
            }
        });

        this._connections.add(connection);
        

        // Send magic bytes and video size to the newly connected socket
        // struct { char magic[4]; unsigned short width, height;}
        let streamHeader = Buffer.alloc(8);
        streamHeader.write(CameraFeed.STREAM_MAGIC_BYTES);
        streamHeader.writeUInt16BE(this._width,  4);
        streamHeader.writeUInt16BE(this._height, 6);
        socket.send(streamHeader, { binary: true });
  
    }

    public Stop()
    {
        this._connections.removeAll();
        this._socketServer?.close();
        this._rtspProxy?.Stop();
    }

    public Send(data : any)
    {
        this._connections.sendBinaryToAll(data);
    }
}
