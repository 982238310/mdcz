import { IpcChannel } from "../IpcChannel";
import type { IpcProcedure } from "../ipcTypes";
import type { LibraryListInput, LibraryListResponse } from "../serverDtos";

export type LibraryIpcContract = {
  [IpcChannel.Library_List]: IpcProcedure<LibraryListInput, LibraryListResponse>;
};
