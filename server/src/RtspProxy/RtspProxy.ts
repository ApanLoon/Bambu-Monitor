import { FfmpegStream, FfmpegStreamEvent } from "./FfmpegStream.js";
import { CameraFeed } from "./CameraFeed.js";
import { Logger } from "../Logger/Logger.js";

export class RtspProxy
{
    private _ffmpegStream : FfmpegStream | undefined;
    private _logger : Logger | undefined;

    constructor (urlString : string, userName: string, password : string, cameraFeed : CameraFeed, logger : Logger | undefined)
    {
        this._logger = logger;
        this._logger?.Log("[RtspProxy] Connecting to camera...");

        let url = new URL(urlString);
        url.username = userName;
        url.password = password;

        this._ffmpegStream = new FfmpegStream();

        this._ffmpegStream.on(FfmpegStreamEvent.Data, data => cameraFeed?.Send(data));

        this._ffmpegStream.on(FfmpegStreamEvent.StreamStarted, ()=>
        {
            this._logger?.Log("[RtspProxy] Stream started.");
            if (this._ffmpegStream === undefined)
            {
                return;
            }

            cameraFeed?.Start(this._ffmpegStream.Width, this._ffmpegStream.Height);
        })

        this._ffmpegStream.Start(url.toString());
    }

    public Stop()
    {
        this._logger?.Log("[RtspProxy] Stopping stream...");
        this._ffmpegStream?.Stop();
    }
}
