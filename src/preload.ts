import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNEL} from './ipcChannel';

contextBridge.exposeInMainWorld('api', {
    getSources: (options: Electron.SourcesOptions) => ipcRenderer.invoke(IPC_CHANNEL.REQUEST_DESKTOP_CAPTURER, options),
    openFileDialog: async () => {
        const result = await ipcRenderer.invoke(IPC_CHANNEL.OPEN_DIALOG);
        return result;
    }
});
