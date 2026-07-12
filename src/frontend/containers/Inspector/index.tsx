import React, { useId } from 'react';
import { observer } from 'mobx-react-lite';

import { useStore } from '../../contexts/StoreContext';
import FileTags from '../../components/FileTag';
import { IconButton, IconSet } from 'widgets';
import { shell } from 'electron';
import { IS_PREVIEW_WINDOW } from 'common/window';
import FileExtraPropertiesEditor from '../../components/FileExtraPropertiesEditor';
import ExifViewer from 'src/frontend/components/ExifViewer';
import FolderInfoView from './FolderInfoView';

const Inspector = observer(() => {
  const { uiStore, fileStore } = useStore();
  const epSectionHeaderId = useId();

  if (
    (uiStore.isSlideMode && !uiStore.isSlideInspectorOpen) ||
    (!uiStore.isSlideMode && !uiStore.isOverviewInspectorOpen)
  ) {
    return (
      <aside id="inspector" className="inspector">
        <Placeholder />
      </aside>
    );
  }

  const first = uiStore.firstSelectedFile ?? uiStore.firstFileInView;

  if (!first || uiStore.fileSelection.size === 0) {
    return <FolderInfoView />;
  }
  const path = first.absolutePath;

  return (
    <aside id="inspector" className="inspector multi-scroll">
      <section><ExifViewer file={first} /></section>
      <section>
        <header>
          <h2>Path to file</h2>
        </header>
        <div className="input-file">
          <input readOnly className="input input-file-value" value={path} />
          <IconButton
            icon={IconSet.FOLDER_CLOSE}
            onClick={() => shell.showItemInFolder(path)}
            text="Open in file explorer"
          />
        </div>
      </section>
      {!IS_PREVIEW_WINDOW && (
        <>
          <section>
            <header id={epSectionHeaderId} className="inspector-extra-porperties-header">
              <h2>Extra properties</h2>
            </header>
            <FileExtraPropertiesEditor
              id="inspector-extra-porperties"
              file={first}
              addButtonContainerID={epSectionHeaderId}
              menuPlacement="left-start"
            />
          </section>
          <section>
            <header>
              <h2>Tags</h2>
            </header>
            <FileTags file={first} />
          </section>
        </>
      )}
    </aside>
  );
});

export default Inspector;

const Placeholder = () => {
  return (
    <section style={{ overflow: 'hidden' }}>
      <header>
        <h2>No image selected</h2>
      </header>
    </section>
  );
};
