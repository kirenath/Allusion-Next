import React, { useState } from 'react';
import { shell } from 'electron';
import { mapStackTrace } from 'sourcemapped-stacktrace';
import { useTranslation } from 'react-i18next';

import { RendererMessenger } from 'src/ipc/renderer';
import { createBugReport, githubUrl } from 'common/config';

import { useStore } from '../contexts/StoreContext';
import i18n from '../i18n';

import { Button, ButtonGroup, IconSet } from 'widgets';
import { Alert, DialogButton } from 'widgets/popovers';

export const ClearDbButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const rootStore = useStore();
  const { fileStore } = rootStore;
  const { t } = useTranslation();

  return (
    <>
      <Button
        styling="outlined"
        icon={IconSet.CLEAR_DATABASE}
        text={t('errorBoundary.clearDatabase')}
        onClick={() => setIsOpen(!isOpen)}
      />
      <Alert
        open={isOpen}
        icon={IconSet.CLEAR_DATABASE}
        title={t('errorBoundary.clearDatabaseConfirm')}
        primaryButtonText={t('errorBoundary.clear')}
        onClick={async (button) => {
          if (button === DialogButton.CloseButton) {
            setIsOpen(false);
          } else {
            fileStore.setDirtyMissingFiles(true);
            fileStore.setDirtyTotalFiles(true);
            fileStore.setDirtyUntaggedFiles(true);
            await rootStore.clearDatabase();
            rootStore.uiStore.closeSettings();
          }
        }}
      >
        <p>{t('errorBoundary.clearDatabaseWarning')}</p>
        <p>{t('errorBoundary.clearDatabaseNote')}</p>
      </Alert>
    </>
  );
};

interface IErrorBoundaryProps {
  children: React.ReactNode;
}

interface IErrorBoundaryState {
  hasError: boolean;
  error: string;
}

class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  state = {
    hasError: false,
    error: '',
  };

  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.openIssueURL = this.openIssueURL.bind(this);
  }

  componentDidCatch(error: Error) {
    // TODO: Send error to logging service
    console.error(error);

    // Map compiled error to source code
    mapStackTrace(error.stack, (sourceMappedStack: string[]) => {
      this.setState({
        error: [
          error.message,
          ...sourceMappedStack.filter((line) => !line.includes('bundle.js')),
        ].join('\n'),
      });
    });
  }

  viewInspector() {
    RendererMessenger.toggleDevTools();
  }

  reloadApplication() {
    RendererMessenger.reload();
  }

  openIssueURL() {
    const encodedBody = encodeURIComponent(
      createBugReport(this.state.error, RendererMessenger.getVersion()),
    );
    const url = `${githubUrl}/issues/new?body=${encodedBody}`;
    shell.openExternal(url);
  }

  render() {
    const { hasError, error } = this.state;
    if (hasError) {
      console.error(error);
      // You can render any custom fallback UI
      return (
        <div className="error-boundary">
          <span className="custom-icon-64">{IconSet.DB_ERROR}</span>
          <h2>{i18n.t('errorBoundary.somethingWentWrong')}</h2>
          <p>{i18n.t('errorBoundary.tryOptions')}</p>
          <ButtonGroup align="center">
            <Button
              onClick={this.reloadApplication}
              styling="outlined"
              icon={IconSet.RELOAD}
              text={i18n.t('errorBoundary.reload')}
            />
            <Button
              onClick={this.viewInspector}
              styling="outlined"
              icon={IconSet.CHROME_DEVTOOLS}
              text={i18n.t('errorBoundary.toggleDevTools')}
            />
            <ClearDbButton />
            <Button
              styling="outlined"
              onClick={this.openIssueURL}
              icon={IconSet.GITHUB}
              text={i18n.t('errorBoundary.createIssue')}
            />
          </ButtonGroup>
          <p className="message">{error.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
