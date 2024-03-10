import React, { useEffect } from 'react';
import { Alert, AlertTitle } from '@mui/material';

interface ErrorAlertProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = props => {
  useEffect(() => {
    let timer: number | undefined;

    if (props.isVisible) {
      timer = window.setTimeout(() => {
        props.onHide();
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [props.isVisible, props.onHide]);

  if (!props.isVisible) return null;

  return (
    <Alert variant='outlined' severity='error' sx={{ mt: 2 }}>
      <AlertTitle>エラー</AlertTitle>
      {props.message}
    </Alert>
  );
};

export default ErrorAlert;
