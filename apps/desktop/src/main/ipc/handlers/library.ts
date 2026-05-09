import type { ServiceContainer } from "@main/container";
import { loggerService } from "@main/services/LoggerService";
import { toErrorMessage } from "@main/utils/common";
import { IpcChannel } from "@mdcz/shared/IpcChannel";
import type { IpcRouterContract } from "@mdcz/shared/ipcContract";
import { asSerializableIpcError, t } from "../shared";

const logger = loggerService.getLogger("IpcRouter:library");

export const createLibraryHandlers = (
  context: ServiceContainer,
): Pick<IpcRouterContract, typeof IpcChannel.Library_List> => ({
  [IpcChannel.Library_List]: t.procedure
    .input<Parameters<typeof context.desktopLibraryService.list>[0]>()
    .action(async ({ input }) => {
      try {
        return await context.desktopLibraryService.list(input ?? {});
      } catch (error) {
        logger.error(`Library list failed: ${toErrorMessage(error)}`);
        throw asSerializableIpcError(error);
      }
    }),
});
