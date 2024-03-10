import path from 'node:path';
import { BrowserWindow, app, dialog, ipcMain, desktopCapturer, nativeImage } from 'electron';
import { readImageFromLocal, FILE_FILTERS } from './imageIO';
import { IPC_CHANNEL } from './ipcChannel';

let win: BrowserWindow | null = null;

// ウィンドウの生成
const createWindow = () => {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    width: 1280,
    height: 960,
    minWidth: 1280,
    minHeight: 960
  });

  win.setMenuBarVisibility(false);

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
});

// すべてのウィンドウが閉じられたら終了
app.once('window-all-closed', () => app.quit());

// ファイル選択ダイアログ
ipcMain.handle(IPC_CHANNEL.OPEN_DIALOG, async (event: Electron.IpcMainInvokeEvent) => {
  if (win === null) {
    throw new Error('ウィンドウが存在しません。');
  }

  const selectedResult: Electron.OpenDialogReturnValue = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: FILE_FILTERS
  });

  if (!selectedResult.filePaths.length) return;

  const fileContent: Buffer | null = readImageFromLocal(selectedResult.filePaths[0]);
  if (!fileContent) return;

  const fileContentBase64: string = `data:image/jpg;base64,${fileContent.toString('base64')}`;

  return {
    fileName: selectedResult.filePaths[0],
    fileContent: fileContentBase64
  };
});

// デスクトップキャプチャ
ipcMain.handle(IPC_CHANNEL.REQUEST_DESKTOP_CAPTURER, async (event: Electron.IpcMainInvokeEvent, options: Electron.SourcesOptions) => {
  const sources: Electron.DesktopCapturerSource[] = await desktopCapturer.getSources(options);

  // App.tsx で thumbnail を toDataURL できないため変換した上で送信
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnailURL: paddingNativeImage(source.thumbnail, options)
  }));
});

// キャプチャしたウィンドウがキャプチャサイズより小さい場合、白でパディング
const paddingNativeImage = (thumbnail: Electron.NativeImage, options: Electron.SourcesOptions) => {
  // キャプチャサイズ
  const desiredWidth: number = options.thumbnailSize?.width!;
  const desiredHeight: number = options.thumbnailSize?.height!;

  // 元の画像サイズ
  const { width, height } = thumbnail.getSize();

  // 新しいイメージのバッファを作成
  // 255(白)で初期化。RGBAなので4掛け
  const paddedBuffer: Buffer = Buffer.alloc(desiredWidth * desiredHeight * 4, 255);

  // 元の画像をバッファにコピー
  const bytesPerPixel: number = 4;
  const sourceBuffer: Buffer = thumbnail.toBitmap();

  // 元の画像各ピクセルを新しいバッファの中央にコピー
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sourceOffset = (y * width + x) * bytesPerPixel;
      const paddedOffset = ((y + Math.floor((desiredHeight - height) / 2)) * desiredWidth + (x + Math.floor((desiredWidth - width) / 2))) * bytesPerPixel;

      paddedBuffer.writeUInt32LE(sourceBuffer.readUInt32LE(sourceOffset), paddedOffset);
    }
  }

  // バッファから新しい NativeImage を作成
  const paddedImage = nativeImage.createFromBuffer(paddedBuffer, {
    width: desiredWidth,
    height: desiredHeight
  });

  return paddedImage.toDataURL();
}
