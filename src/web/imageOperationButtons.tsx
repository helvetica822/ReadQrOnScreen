import React from 'react';
import { Button, ButtonGroup, Grid } from '@mui/material';
import { CameraAlt, FileOpen, ClearAll } from '@mui/icons-material';

interface ImageOperationButtonsProps {
  onFileOpen: () => void;
  onScreenCapture: () => void;
  onClear: () => void;
}

const ImageOperationButtons: React.FC<ImageOperationButtonsProps> = props => {
  return (
    <Grid container sx={{ mt: 2, mb: 3 }}>
      <Grid item xs={6}>
        <ButtonGroup
          variant='outlined'
          color='primary'>
          <Button onClick={props.onFileOpen}>
            画像選択
            <FileOpen sx={{ ml: 0.5 }} />
          </Button>
          <Button onClick={props.onScreenCapture}>
            画面キャプチャ
            <CameraAlt sx={{ ml: 0.5 }} />
          </Button>
        </ButtonGroup>
      </Grid>

      <Grid item xs={6} textAlign='right'>
        <Button variant='outlined' onClick={props.onClear}>
          クリア
          <ClearAll sx={{ ml: 0.5 }} />
        </Button>
      </Grid>
    </Grid>
  );
};

export default ImageOperationButtons;
