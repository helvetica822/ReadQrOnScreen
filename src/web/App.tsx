import './App.css';
import 'react-image-crop/dist/ReactCrop.css'

import React, { useState, useCallback } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import { Container, TextField, Typography, Paper, Alert, ImageList, ImageListItem, ImageListItemBar, IconButton } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import jsQR from 'jsqr';

import ImageOperationButtons from './imageOperationButtons';
import ErrorAlert from './errorAlert';

interface Source {
  id: string;
  name: string;
  thumbnailURL: string;
}

interface SourceWithThumbnailURL extends Electron.DesktopCapturerSource {
  thumbnailURL: string;
}

declare global {
  interface Window {
    api: {
      getSources: (options: Electron.SourcesOptions) => Promise<Electron.DesktopCapturerSource[]>,
      openFileDialog: () => Promise<{ fileName: string; fileContent: string; }>;
    }
  }
}

const CROP_DEFAULT: Crop = { unit: '%', width: 50, height: 50, x: 25, y: 25 };

const App: React.FC = () => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');

  const [sources, setSources] = useState<Source[]>([]);

  const [useCapture, setShowCapture] = useState(false);

  const [crop, setCrop] = useState<Crop>(CROP_DEFAULT);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const [isVisibleError, setIsVisibleError] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const [isVisibleErrorQrResult, setIsVisibleErrorQrResult] = useState<boolean>(false);

  // ファイル選択ダイアログ
  const onOpenDialogAndFetchFile = async () => {
    try {
      const fileInfo = await window.api.openFileDialog();

      if (fileInfo) {
        setFileName(`file://${fileInfo.fileName}`);
        setCroppedImageUrl('');
        setContent('');

        setShowCapture(false);
      }
    } catch (error) {
      setIsVisibleError(true);
      setMessage('画像ファイルを読み込めませんでした。');
    }
  };

  // 画像読み込み処理
  const onImageLoaded = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setImageRef(event.currentTarget);
  }, []);

  // デスクトップキャプチャ
  const onCaptureScreen = (): void => {
    fetchSources();
    setShowCapture(true);
    setFileName('');
    setCroppedImageUrl('');
    setContent('');
  };

  // 指定した画面のキャプチャ
  const onCaptureSelectedScreen = async (sourceId: string) => {
    const options: Electron.SourcesOptions = {
      types: ['window', 'screen'],
      thumbnailSize: { width: 640, height: 360 }
    };

    const sources = await window.api.getSources(options) as SourceWithThumbnailURL[];
    const matchingSource = sources.find(source => source.id === sourceId);

    setFileName(`${matchingSource!.thumbnailURL}`);
    setCrop(CROP_DEFAULT);
  };

  // キャプチャ対象画面の表示
  const fetchSources = async () => {
    const options: Electron.SourcesOptions = {
      types: ['window', 'screen'],
      thumbnailSize: { width: 256, height: 144 }
    };

    const sources: SourceWithThumbnailURL[] = await window.api.getSources(options) as SourceWithThumbnailURL[];

    setSources(sources.map(source => ({
      id: source.id,
      name: source.name,
      thumbnailURL: source.thumbnailURL
    })));
  };

  // クリア
  const onClearAll = () => {
    setShowCapture(false);
    setFileName('');
    setCroppedImageUrl('');
    setContent('');
  };

  // クロッピング対象の変更処理
  const onCropChange = (crop: Crop) => {
    setCrop(crop);
  };

  // クロッピング完了後処理
  const onCropComplete = useCallback(() => {
    if (imageRef && crop.width && crop.height) {
      const croppedImageUrl = getCroppedImg(imageRef, crop);
      setCroppedImageUrl(croppedImageUrl);
    }
  }, [imageRef, crop]);

  // クロッピング
  const getCroppedImg = (image: HTMLImageElement, crop: Crop): string => {
    const canvas: HTMLCanvasElement = document.createElement('canvas');

    canvas.width = crop.width!;
    canvas.height = crop.height!;

    const ctx = canvas.getContext('2d');

    if (ctx) {
      const scaleX: number = image.naturalWidth / image.width;
      const scaleY: number = image.naturalHeight / image.height;

      ctx.drawImage(
        image,
        crop.x! * scaleX,
        crop.y! * scaleY,
        crop.width! * scaleX,
        crop.height! * scaleY,
        0,
        0,
        crop.width!,
        crop.height!
      );

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        setContent(code.data);
      }
      else {
        setContent('');
        setIsVisibleErrorQrResult(true);
      }
    }

    return canvas.toDataURL('image/jpg');
  };

  return (
    <Container>
      <ImageOperationButtons
        onFileOpen={onOpenDialogAndFetchFile}
        onScreenCapture={onCaptureScreen}
        onClear={onClearAll} />

      {useCapture &&
        <Paper sx={{ p: 2 }}>
          <Typography variant='h5'>キャプチャ可能ウィンドウ</Typography>

          <Alert variant='outlined' severity='info' sx={{ mt: 2 }}>
            キャプチャ対象を選択してください。<br />
            『画面キャプチャ』ボタンをクリックすることでキャプチャ対象が更新されます。
          </Alert>

          <ImageList cols={5}>
            {sources.map((source) => (
              <ImageListItem key={source.id}>
                <img
                  srcSet={`${source.thumbnailURL}`}
                  src={`${source.thumbnailURL}`}
                  alt={source.name}
                  loading='lazy' />
                <ImageListItemBar
                  title={source.name}
                  actionIcon={
                    <IconButton
                      sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                      onClick={() => onCaptureSelectedScreen(source.id)} >
                      <CheckCircle />
                    </IconButton>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </Paper>
      }

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant='h5'>オリジナル画像</Typography>

        {fileName ? (
          <ReactCrop crop={crop} onChange={onCropChange} onComplete={onCropComplete}>
            <img src={fileName} onLoad={onImageLoaded} />
          </ReactCrop>
        ) : (
          <Alert variant='outlined' severity='info' sx={{ mt: 2 }}>
            選択した画像またはキャプチャした画面がここに表示されます。
          </Alert>
        )}

        <ErrorAlert message={message} isVisible={isVisibleError} onHide={() => setIsVisibleError(false)} />
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant='h5'>トリミング画像</Typography>

        {croppedImageUrl && <img src={croppedImageUrl} />}
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant='h5'>読み取り結果</Typography>

        <TextField multiline fullWidth variant='outlined' rows={5} value={content}
          inputProps={{ style: { fontSize: 14 } }}
        />

        <ErrorAlert message='QRコードの読み取りができませんでした。' isVisible={isVisibleErrorQrResult} onHide={() => setIsVisibleErrorQrResult(false)} />
      </Paper>
    </Container>
  );
};

export default App;
