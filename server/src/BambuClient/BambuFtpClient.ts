import {XMLParser} from "fast-xml-parser";
import AdmZip from "adm-zip";
import fs, { readFileSync } from "fs";
import Path from "path";
import { Project } from "../shared/Project.js"
import { BambuClientOptions } from "./BambuClient.js";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

export class BambuFtpOptions
{
    Port          : number = 990;
    LocalFilePath : string = "archive";
    MaxRetries    : number = 3;
    RetryDelay    : number = 1000; // milliseconds

    public constructor(options? : Partial<BambuFtpOptions>)
    {
        if (options)
        {
            Object.assign(this, options);
        }
    }
}

export class BambuFtpClient
{
    private _options : BambuClientOptions;
    
    public constructor(options : BambuClientOptions)
    {
        this._options = options;

        try
        {
            // Check if local file path exists:
            if (fs.existsSync(this._options.FtpOptions.LocalFilePath))
            {
                if (fs.statSync(this._options.FtpOptions.LocalFilePath).isDirectory() == false)
                {
                    this._options.Logger?.Log("[BambuFtpClient] Constructor: Local file path exists but is not a directory. Ftp downloads will not work.");
                }
            }
            else
            {
                // Create the folder for local file storage:
                fs.mkdirSync(this._options.FtpOptions.LocalFilePath);
            }            
        }
        catch (err : any)
        {
            this._options.Logger?.Log(`[BambuFtpClient] Constructor: Error: ${err}`);
        }
    }

    public async DownloadProject (srcPath : string, prefix : string) : Promise<Project | null>
    {
        const logUrl = `ftps://${this._options.UserName}@${this._options.Host}:${this._options.FtpOptions.Port}/${srcPath}`;
        const projectFile = `${prefix}-${srcPath.replace(/(\.gcode)(?!.*\1)/, "")}`;
        const projectPath = `${this._options.FtpOptions.LocalFilePath}/${projectFile}`; // TODO: Danger! You need to make sure that the resulting path is safe!

        this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: Trying to get file ${logUrl}.`);

        let remainingRetries = this._options.FtpOptions.MaxRetries;
        while (remainingRetries > 0)
        {
            try
            {
                await this.DownloadFile(`ftps://${this._options.UserName}:${this._options.Password}@${this._options.Host}:${this._options.FtpOptions.Port}`, srcPath, projectPath);
                break; // Exit the retry loop if download is successful
            }
            catch (err : any)
            {
                this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: Error downloading project from ${logUrl}. ${err}`);
                remainingRetries--;
                if (remainingRetries == 0)
                {
                    this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: Maximum retries reached for project file ${logUrl}. Giving up. `);
                    return null;
                }
                else
                {
                    await new Promise(resolve => setTimeout(resolve, this._options.FtpOptions.RetryDelay));
                }
            }
        }

        try
        {
            // Unzip 3mf file:
            let p = Path.parse(projectPath);
            let dstFolder = Path.join(p.dir, p.name); // Remove extension 3mf
            const escapedDstFolder = Path.join(p.dir, encodeURIComponent(p.name)); // Use this for storing links to this folder

            new AdmZip(projectPath).extractAllTo(dstFolder, true);

            let project : Project = new Project();

            this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: File ${logUrl} unpacked. Reading project settings...`);

            // Read project_settings.config:
            const projectSettings = JSON.parse(await fs.promises.readFile(Path.join(dstFolder, "Metadata", "project_settings.config"), "utf-8"));
            project.SettingsName = projectSettings?.print_settings_id;

            this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: File ${logUrl} project settings read. Reading model settings...`);

            // Read model_settings.config:
            const modelSettingsParser = new XMLParser(
            {
                ignoreAttributes: false,
                attributeNamePrefix: "",
                isArray: (tagName : string) => {return tagName === "plate" }
            });
            const modelSettings = modelSettingsParser.parse(readFileSync(Path.join(dstFolder, "Metadata", "model_settings.config")));

            // Map metadata key/value to plate objects:
            const plates = modelSettings.config.plate.map( (x : { metadata : Array<{ key: string; value: string; }> }) => Object.fromEntries(x.metadata.map((g: { key: string; value: string; } ) => [g.key, g.value])));

            // Find the first plate that has a gcode file:
            const plate = plates.find((x : { gcode_file : string; thumbnail_file : string; }) => x.gcode_file !== "");
            project.PlateName = plate?.plater_name;
            project.ThumbnailFile = Path.join(escapedDstFolder, plate?.thumbnail_file);

            this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: File ${logUrl} model settings read. Reading slice info...`);

            // Read slice_info.config:
            const sliceInfoParser = new XMLParser(
            {
                ignoreAttributes: false,
                attributeNamePrefix: "",
                isArray: (tagName : string) => { return ["metadata", "object", "filament"].includes (tagName) }
            });
            const sliceInfo = sliceInfoParser.parse(readFileSync(Path.join(dstFolder, "Metadata", "slice_info.config")));

            const metadata = Object.fromEntries(sliceInfo?.config?.plate?.metadata?.map((g: { key: string; value: string; } ) => [g.key, g.value]));
            project.PlateIndex = Number(metadata?.index);
            project.TotalWeight = Number(metadata?.weight);
            project.Filaments = sliceInfo?.config?.plate?.filament?.map ((x:any) => ({ TrayId: Number(x.id), Type: x.type, Colour: x.color, UsedLength: Number(x.used_m), UsedWeight: Number(x.used_g) }));

            this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: File ${logUrl} read successfully.`);

            return project;
        }
        catch (err : any)
        {
            this._options.Logger?.Log(`[BambuFtpClient] DownloadProject: Error parsing project from ${logUrl}. ${err}`);
            return null;
        }
    }

    private async DownloadFile (connectionString : string, srcPath : string, dstPath : string)
    {
        const command = `lftp -c "`
        + ` set xfer:clobber true;`
        + ` set ftp:ssl-force true;`
        + ` set ftp:ssl-protect-data true;`
        + ` set ftp:ssl-auth TLS;`
        + ` set ssl:verify-certificate no;`
        + ` connect '${connectionString}';`
        + ` get '${srcPath}' -o '${dstPath}'; bye;"`;

        try
        {
            const { stdout, stderr } = await execAsync(command);
            if (stderr && stderr.trim().length > 0)
            {
                throw new Error(`LFTP Error: ${stderr}`);
            }
        }
        catch (error)
        {
            throw new Error(`Error: ${error}`);
        }
    }
}
