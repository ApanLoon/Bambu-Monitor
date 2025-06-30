
import { ref, type Ref } from "vue";
import { type IBambuMonitorClient, LogLevel } from "./IBambuMonitorClient";
import { Job, JobState } from "../../../server/src/shared/Job";
import { BambuMonitorClientMessage, BambuMonitorServerMessage } from "../../../server/src/shared/BambuMonitorApi";
import { HomeFlag, SdCardState, Status } from "../../../server/src/shared/BambuMessages";
import { Project } from "../../../server/src/shared/Project";

export class BambuMonitorClientOptions
{
    public Host : string = "localhost";
    public Port : number = 4000;
}

export class BambuMonitorClient implements IBambuMonitorClient
{
    Options: BambuMonitorClientOptions;
    IsConnected: Ref<boolean> = ref(false);
    IsPrinterConnected : Ref<boolean> = ref(false);

    Status: Ref<Status> = ref(new Status);

    public HomeFlag    : Ref<HomeFlag> = ref(new HomeFlag());
    public SdCardState : Ref<SdCardState> = ref(SdCardState.NO_SDCARD);
    
    LogLevel: Ref<LogLevel> = ref(LogLevel.Information);
    Log: Ref<string[]> = ref([]);

    CurrentJob: Ref<Job | null> = ref(null);
    JobHistory: Ref<Array<Job>> = ref([]);

    private _socket? : WebSocket;
    private _keepAliveInterval = 5000;
    private _keepAlive : ReturnType<typeof setInterval> | null = null;

    constructor(options : BambuMonitorClientOptions)
    {
        this.Options = options;
    }

    // TODO: Testing Zone:
    // private _useDebugJob = true;
    // private CreateDebugJob()
    // {
    //     let now = new Date();
    //     let start = new Date();
    //     start.setMinutes(now.getMinutes() - 5);
    //     let stop = new Date();
    //     stop.setMinutes(now.getMinutes() + 100);

    //     return new Job(
    //         "371f11c0-60cf-49d9-bd19-5ba2ee46f2b7",
    //         start,
    //         stop,
    //         "gecko_even_better2",
    //         "/data/Metadata/plate_1.gcode",
    //         JobState.Started,
    //         {
    //             SettingsName: "0.08mm Extra Fine @Apan",
    //             PlateIndex: 1,
    //             PlateName: "Gecko",
    //             ThumbnailFile: "projectArchive\\20250501-182000-gecko_even_better2\\Metadata\\plate_1.png",
    //             TotalWeight: 3.94,
    //             Filaments:
    //             [
    //                 {
    //                     TrayId: 1,
    //                     Type: "PLA",
    //                     Colour: "#8e9089",
    //                     UsedLength: 1.3,
    //                     UsedWeight: 3.94,
    //                     BrandFamily: "PLA Basic",
    //                     BrandId: "A00-D0",
    //                     IsBBL: true,
    //                     Uuid: "5D150431BEB44531BBE9E36718E9AC3A",
    //                     BrandFamilyId: "GFA00"
    //                 }
    //             ]
    //         } as Project
    //     );
    // }

    public Connect(connectHandler? : () => void) : void
    {
        console.log(`[BambuMonitorClient] Connecting to ${this.Options.Host}:${this.Options.Port}...`);

        this._socket = new WebSocket(`wss://${this.Options.Host}:${this.Options.Port}/api`);

        this._socket.addEventListener("open", () => 
        {
            console.log(`[BambuMonitorClient] Connected to ${this.Options.Host}:${this.Options.Port}`);
            this.IsConnected.value = true;
            this._keepAlive = window.setInterval(()=>this._socket?.send(JSON.stringify({Type: "KeepAlive"})), this._keepAliveInterval);

            if (connectHandler)
            {
                connectHandler();
            }
        });
        
        this._socket.addEventListener("message", (event) => 
        {
            const msg = JSON.parse(event.data);
        
            switch (msg.Type)
            {
                case BambuMonitorClientMessage.Status:                  this.updateStatus(msg.Status as Status);                   break;
                case BambuMonitorClientMessage.PrinterConnectionStatus: this.IsPrinterConnected.value = msg.IsConnected;           break;
                case BambuMonitorClientMessage.PrinterLogLevel:         this.LogLevel.value           = msg.Level as LogLevel;     break;
                case BambuMonitorClientMessage.MessageLogged:           this.Log.value.push (msg.Message);                         break;
                case BambuMonitorClientMessage.CurrentJob:              this.UpdateCurrentJob (msg.Job);                           break;
                case BambuMonitorClientMessage.JobHistory:              this.UpdateJobHistory (msg.Jobs);                          break;
                case BambuMonitorClientMessage.JobUpdated:              this.jobUpdated (msg.Job);                                 break;
            }
        });

        this._socket.onclose = error =>
        {
            console.log("[BambuMonitorClient] Connection closed.", error);
            this.IsConnected.value = false;
            if (this._keepAlive != null) window.clearInterval(this._keepAlive);
            window.setTimeout(()=>this.Connect(connectHandler), 1000);
        }
    }

    private UpdateCurrentJob(job : Job)
    {
        // TODO: Testing Zone:
        // if (this._useDebugJob)
        // {
        //     this.CurrentJob.value = this.CreateDebugJob();
        //     return;
        // }

        if (job !== null)
        {
            job.StartTime = new Date(job.StartTime);
            job.StopTime = job.StopTime == null ? null : new Date(job.StopTime);
        }
        this.CurrentJob.value = job;
    }

    private UpdateJobHistory(jobs : Array<Job>)
    {
        jobs.forEach(job =>
        {
            job.StartTime = new Date(job.StartTime);
            job.StopTime = job.StopTime == null ? null : new Date(job.StopTime);
        });
        this.JobHistory.value = jobs;
    }

    private updateStatus(status : Status)
    {
        this.Status.value      = status;
        this.HomeFlag.value    = new HomeFlag(status?.home_flag);
        this.SdCardState.value = this.HomeFlag.value.sdCardState();    
    }

    private jobUpdated(updatedJob : Job)
    {
        let job = this.JobHistory.value.find (x => x.Id === updatedJob.Id);
        if (job === undefined)
        {
            this.JobHistory.value.push (updatedJob);
        }
        else
        {
            Object.assign(job, updatedJob);
            job.StartTime = new Date(job.StartTime);
            job.StopTime = job.StopTime == null ? null : new Date(job.StopTime);
        }
    }

    public GetState(): void
    {
        this._socket?.send(JSON.stringify(
        {
            Type: BambuMonitorServerMessage.GetState
        }));
    }

    public SetPrinterLogLevel(level : LogLevel)
    {
        this._socket?.send(JSON.stringify(
        {
            Type: BambuMonitorServerMessage.SetPrinterLogLevel,
            Level: level
        }));
    }

    public RequestJobHistory()
    {
        this.Log.value = [];
        this._socket?.send(JSON.stringify(
        {
            Type: BambuMonitorServerMessage.RequestJobHistory
        }));
    }

    public RequestFullLog()
    {
        this.Log.value = [];
        this._socket?.send(JSON.stringify(
        {
            Type: BambuMonitorServerMessage.RequestFullLog
        }));
    }

    public SaveJobComment(job: Job, newComment: string)
    {
        this._socket?.send(JSON.stringify(
        {
            Type:       BambuMonitorServerMessage.SaveJobComment,
            Job:        job,
            NewComment: newComment
        }));
    }

    public SaveJobRecipient(job: Job, newRecipient: string)
    {
        this._socket?.send(JSON.stringify(
        {
            Type:         BambuMonitorServerMessage.SaveJobRecipient,
            Job:          job,
            NewRecipient: newRecipient
        }));
    }
}
