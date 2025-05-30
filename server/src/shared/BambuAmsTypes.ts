/*
export enum AmsRfidState
{
    INIT,
    LOADING,
    DONE,
};

export enum AmsStep
{
    INIT,
    HEAT_EXTRUDER,
    LOADING,
    COMPLETED,
};

export enum AmsRoadPosition
{
    TRAY,     // filament at tray
    TUBE,     // filament at tube
    HOTEND,   // filament at hotend
};
*/

export enum AmsStatusMain
{
    IDLE                = 0x00,
    FILAMENT_CHANGE     = 0x01,
    RFID_IDENTIFYING    = 0x02,
    ASSIST              = 0x03,
    CALIBRATION         = 0x04,
    SELF_CHECK          = 0x10,
    DEBUG               = 0x20,
    UNKNOWN             = 0xFF,
};

// When AmsStatusMain is FILAMENT_CHANGE (1):
export enum FilamentStep
{
    IDLE               = 0,
    HEAT_NOZZLE        = 1,
    CUT_FILAMENT       = 2,
    PULL_CURR_FILAMENT = 3,
    PUSH_NEW_FILAMENT  = 4,
    PURGE_OLD_FILAMENT = 5,
    FEED_FILAMENT      = 6,
    CONFIRM_EXTRUDED   = 7,
    CHECK_POSITION     = 8
};

// When AmsStatusMain is RFID_IDENTIFYING (2):
export enum AmsRfidStatus
{
    IDLE           = 0,
    READING        = 1,
    GCODE_TRANS    = 2,
    GCODE_RUNNING  = 3,
    ASSITANT       = 4,
    SWITCH_FILAMENT= 5,
    HAS_FILAMENT   = 6
};

/*
export enum AmsOptionType
{
    STARTUP_READ,
    TRAY_READ,
    CALIBRATE_REMAIN
};
*/

export class Tray
{
    public bed_temp        : string = "0"; // "35"
    public bed_temp_type   : string = "1";
    public cali_idx        : number = -1;
    public cols            : Array<string> = []; // RGBA "8E9089FF"
    public c_type          : number = 0;
    public drying_temp     : string = "0"; // "55"
    public drying_time     : string = "0"; // "8"
    public id              : string = "0"; // "0"
    public nozzle_temp_max : string = "0"; // "230"
    public nozzle_temp_min : string = "0"; // "190"
    public remain          : number = 0;   // 42
    public tag_uid         : string = "";  // "4CC0983900000100"
    public tray_color      : string = "";  // RGBA "8E9089FF"
    public tray_diameter   : string = "0"; // "1.75"
    public tray_id_name    : string = "";  // "A00-D0"
    public tray_info_idx   : string = "";  // "GFA00"
    public tray_sub_brands : string = "";  // "PLA Basic"
    public tray_type       : string = "";  // "PLA"
    public tray_uuid       : string = "";  // "D046EF8FB5204757B64FEA3C90357E2C",
    public tray_weight     : string = "";  // "1000"
    public xcam_info       : string = "";  // "D007D007E803E8039A99193F"
}

export class AmsInstance
{
    public humidity : string = "";  // "5"
    public id       : string = "0"; // "0",
    public temp     : string = "0"; // "26.9"
    public tray     : Array<Tray> = [];
}

export class Ams
{
    public ams                 : Array<AmsInstance> = [];
    public ams_exist_bits      : string = "0";   // "1"
    public ams_exist_bits_raw  : string = "0";   // "1"
    public insert_flag         : boolean = true; // true
    public power_on_flag       : boolean = true; // true
    public tray_exist_bits     : string = "0";   // "0-f" When a bit is set the corresponting tray has filament in it
    public tray_is_bbl_bits    : string = "0";   // "0-f" When a bit is set the filament in the corresponting tray is from Bambu Lab
    public tray_now            : string = "255"; // Currently loaded tray index. "255" means none.
    public tray_pre            : string = "255"; // Previously loaded tray index. "255" means none.
    public tray_read_done_bits : string = "0";   // "0-f" When a bit is set the corresponding tray has been read and all information we can get has been updated
    public tray_reading_bits   : string = "0";   // "0-f" When a bit is set the corresponding tray is being read. We don't have accurate information yet.
    public tray_tar            : string = "255"; // Tray target when switching the tray, "255" means none.
    public version             : number = 0;     // 420
}

const AmsIndex = (index : number) : [number, number] =>
{
    return [Math.floor (index / 4), index % 4];
}

export const AmsTrayBrandFamily = (ams : Ams, index : number) =>
{
    const [amsIndex, trayIndex] = AmsIndex (index);
    return ams.ams[amsIndex]?.tray[trayIndex]?.tray_sub_brands ?? "";
}

export const AmsTrayBrandFamilyId = (ams : Ams, index : number) =>
{
    const [amsIndex, trayIndex] = AmsIndex (index);
    return ams.ams[amsIndex]?.tray[trayIndex]?.tray_info_idx ?? "";
}

export const AmsTrayBrandId = (ams : Ams, index : number) =>
{
    const [amsIndex, trayIndex] = AmsIndex (index);
    return ams.ams[amsIndex]?.tray[trayIndex]?.tray_id_name ?? "";
}
    
export const AmsTrayUuid = (ams : Ams, index : number) =>
{
    const [amsIndex, trayIndex] = AmsIndex (index);
    return ams.ams[amsIndex]?.tray[trayIndex]?.tray_uuid ?? "";
}

export const AmsTrayIsBbl = (ams : Ams, index : number) =>
{
    return AmsCheckBit(index, ams.tray_is_bbl_bits);
}

const AmsCheckBit = (index : number, bitString : string) =>
{
    let mask = Math.pow(2, index);
    let bits = Number("0x" + bitString);
    return ((bits & mask) != 0);
}

export const AmsStatus2Main = (status : number ) =>
{
    return (status & 0xFF00) >> 8;
}
export const AmsStatus2Sub = (status : number ) =>
{
    return status & 0xFF;
}
    
export const AmsStatus2String = (status : number) =>
{
    if (status === 0)
    {
        return "IDLE";
    }

    let main = AmsStatus2Main(status);
    let sub  = AmsStatus2Sub(status);

    switch (main)
    {
        case AmsStatusMain.FILAMENT_CHANGE:
            return FilamentStep[sub] ?? `Unknown filament step (${sub})`;
        case AmsStatusMain.RFID_IDENTIFYING:
            return AmsRfidStatus[sub] ?? `Unknown RFID status (${sub})`;
        default:
            return `${AmsStatusMain[main]}:${sub}`;
    }
}
