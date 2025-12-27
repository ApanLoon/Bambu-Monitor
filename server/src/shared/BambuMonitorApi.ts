// Messages sent by the client to the server.
export const BambuMonitorServerMessage = Object.freeze (
{
  GetState:           "GetState",
  SetLight:           "SetLight",
  
  GetPrinterLogLevel: "GetPrinterLogLevel",
  SetPrinterLogLevel: "SetPrinterLogLevel",
  RequestFullLog:     "RequestFullLog",
  
  RequestJobPause:    "RequestJobPause",
  RequestJobResume:   "RequestJobResume",
  RequestJobStop:     "RequestJobStop",
  RequestJobHistory:  "RequestJobHistory",
  SaveJobComment:     "SaveJobComment",
  SaveJobRecipient:   "SaveJobRecipient"
});

// Messages sent by the server to the client.
export const BambuMonitorClientMessage = Object.freeze (
{
  Status:                  "Status",
  PrinterConnectionStatus: "PrinterConnectionStatus",
  PrinterLogLevel:         "PrinterLogLevel",
  MessageLogged:           "MessageLogged",
  CurrentJob:              "CurrentJob",
  JobHistory:              "JobHistory",
  JobUpdated:              "JobUpdated"
});
