/* eslint-disable react/no-unescaped-entities */
import { observer } from 'mobx-react-lite';
import React, { memo, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { chromeExtensionUrl, firefoxExtensionUrl } from 'common/config';
import i18n from '../i18n';
import { clamp } from 'common/core';
import Logo_About from 'resources/images/helpcenter/logo-about-helpcenter-dark.jpg';
import { Button, ButtonGroup, IconSet, Split } from 'widgets';
import { ToolbarButton } from 'widgets/toolbar';
import ExternalLink from '../components/ExternalLink';
import PopupWindow from '../components/PopupWindow';
import { useStore } from '../contexts/StoreContext';

const HelpCenter = observer(() => {
  const { uiStore } = useStore();

  if (!uiStore.isHelpCenterOpen) {
    return null;
  }
  return (
    <PopupWindow
      onClose={uiStore.closeHelpCenter}
      windowName="help-center"
      closeOnEscape
      additionalCloseKey={uiStore.hotkeyMap.toggleHelpCenter}
    >
      <Documentation
        id="help-center"
        overviewId="help-center-overview"
        className={`${uiStore.theme} scrollbar-classic`}
        initPages={PAGE_DATA}
      />
    </PopupWindow>
  );
});

export default HelpCenter;

interface IDocumentation {
  id?: string;
  overviewId: string;
  className?: string;
  initPages: () => IPageData[];
}

const Documentation = ({ id, overviewId, className, initPages }: IDocumentation) => {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = useRef(initPages()).current;

  const [isIndexOpen, setIndexIsOpen] = useState(true);
  const [splitPoint, setSplitPoint] = useState(224); // 14rem
  const handleMove = useCallback(
    (x: number, width: number) => {
      const minWidth = 224;
      if (isIndexOpen) {
        const w = clamp(x, minWidth, width * 0.75);
        setSplitPoint(w);

        if (x < minWidth * 0.75) {
          setIndexIsOpen(false);
        }
      } else if (x >= minWidth) {
        setIndexIsOpen(true);
      }
    },
    [isIndexOpen],
  );

  return (
    <div id={id} className={className}>
      <Split
        primary={<Overview id={overviewId} pages={pages} openPage={setPageIndex} />}
        secondary={
          <Page
            toolbar={
              <PageToolbar
                isIndexOpen={isIndexOpen}
                toggleIndex={setIndexIsOpen}
                controls={overviewId}
              />
            }
            pages={pages}
            openPage={setPageIndex}
            pageIndex={pageIndex}
          />
        }
        axis="vertical"
        align="left"
        splitPoint={splitPoint}
        isExpanded={isIndexOpen}
        onMove={handleMove}
      />
    </div>
  );
};

interface IOverview {
  id: string;
  pages: IPageData[];
  openPage: (page: number) => void;
}

const Overview = memo(function Overview({ id, pages, openPage }: IOverview) {
  return (
    <nav id={id} className="doc-overview">
      {pages.map((page, pageIndex) => (
        <details open key={page.title}>
          <summary>
            {page.icon}
            {page.title}
          </summary>
          {page.sections.map((section) => (
            <a
              key={section.title}
              href={`#${section.title.toLowerCase().replaceAll(' ', '-')}`}
              onClick={() => openPage(pageIndex)}
            >
              {section.title}
            </a>
          ))}
        </details>
      ))}
    </nav>
  );
});

interface IPage {
  toolbar: React.ReactNode;
  pages: IPageData[];
  pageIndex: number;
  openPage: (page: number) => void;
}

const Page = (props: IPage) => {
  const { toolbar, pages, pageIndex, openPage } = props;
  const { t } = useTranslation();

  const buttons = [];
  if (pageIndex > 0) {
    const previousPage = () => openPage(pageIndex - 1);
    buttons.push(
      <Button key="previous" styling="outlined" onClick={previousPage} text={t('helpcenter.previous')} />,
    );
  }
  if (pageIndex < pages.length - 1) {
    const nextPage = () => openPage(pageIndex + 1);
    buttons.push(<Button key="next" styling="outlined" onClick={nextPage} text={t('helpcenter.next')} />);
  }

  return (
    <div className="doc-page">
      {toolbar}
      <article className="doc-page-content">
        {pages[pageIndex].sections.map((section) => (
          <section id={section.title.toLowerCase().replaceAll(' ', '-')} key={section.title}>
            <h2>{section.title}</h2>
            {section.content}
          </section>
        ))}
        <ButtonGroup>{buttons}</ButtonGroup>
      </article>
    </div>
  );
};

interface IPageToolbar {
  isIndexOpen: boolean;
  toggleIndex: React.Dispatch<React.SetStateAction<boolean>>;
  controls: string;
}

const PageToolbar = ({ isIndexOpen, toggleIndex, controls }: IPageToolbar) => {
  const { t } = useTranslation();
  return (
    <div role="toolbar" className="doc-page-toolbar" data-compact>
      <ToolbarButton
        text={t('helpcenter.toggleIndex')}
        icon={isIndexOpen ? IconSet.DOUBLE_CARET : IconSet.MENU_HAMBURGER}
        pressed={isIndexOpen}
        controls={controls}
        onClick={() => toggleIndex((value) => !value)}
        tabIndex={0}
      />
    </div>
  );
};

interface IPageData {
  title: string;
  icon: React.ReactNode;
  sections: { title: string; content: React.ReactNode }[];
}

const PAGE_DATA: () => IPageData[] = () => [
  {
    title: i18n.t('helpcenter.aboutAllusion'),
    icon: IconSet.LOGO,
    sections: [
      {
        title: i18n.t('helpcenter.whatIsAllusion'),
        content: (
          <>
            <img className="centered" src={Logo_About} alt="Logo" />
            <p>
              <strong>
                Allusion 是一款专为艺术家设计的工具，旨在帮助他们整理视觉素材库。创意工作者在项目中经常使用参考图片，这非常普遍。
              </strong>
            </p>
            <p>
              借助互联网技术，寻找此类图片已变得相对容易。然而，管理这些图片仍然是一个挑战。我们关注的不是能存储多少图片，而是能有效地访问哪些图片。如果只有少量图片与我们相关，那很容易记住它们，但许多艺术家希望创建自己的精选素材库，在这种情况下，记住图片位置变得越来越困难。Allusion 正是为了帮助艺术家整理视觉素材库而创建的。要了解 Allusion 的工作原理，请继续阅读。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: i18n.t('helpcenter.librarySetup'),
    icon: IconSet.META_INFO,
    sections: [
      {
        title: i18n.t('helpcenter.gettingStarted'),
        content: (
          <>
            <p>
              素材库设置指的是将图片导入 Allusion 的过程，以便它们可以被管理和查看。Allusion 不手动从文件系统导入图片，而是专注于链接的文件夹，我们称之为{' '}
              <b>位置</b>。继续阅读以了解如何向您的 Allusion 素材库添加图片。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.locations'),
        content: (
          <>
            <p>
              在 Allusion 中，向素材库添加图片的主要方式是使用“位置”。位置在此上下文中是指指向您计算机上文件夹的链接。这意味着该文件夹中的所有图片以及任何子文件夹都会自动加载，一旦它们被添加到您的位置列表中。
              <br />
              这种系统的优势在于您可以完全控制数据存储的位置，而无需从各个地方手动繁琐地导入图片。要添加更多图片，只需将它们放入链接的文件夹中，它们会自动出现在 Allusion 中。
              <br />
              然而，从链接的文件夹中移除图片不会自动从 Allusion 中移除它们，以防止您在意外删除图片或移动它们时丢失已分配的标签。要向 Allusion 确认文件是有意删除的，您可以在“缺失图片”视图中选择这些图片并按下工具栏中的删除按钮。否则，您可以将图片放回原始路径，Allusion 会自动重新检测到它们。
              <br />
              您可以自由地重命名图片，并将它们移动到不同的文件夹，只要它们保持在同一位置内。Allusion 会在您重启应用程序时自动检测到这些变化。
            </p>
            <p>
              要添加新位置，打开大纲视图并将鼠标悬停在位置的标题上。您会看到右侧有一个小加号图标。点击该图标后，浏览包含图片的文件夹。确认您的选择，并在以下弹出窗口中选择位置偏好设置。您有选项在此过程中排除子文件夹。稍后排除子文件夹也是可能的，但请记住 Allusion 不会为排除的文件夹存储标签数据。选择排除子文件夹时，任何现有的标签数据都会被移除。一旦确认，您的图片会出现在内容区域。
            </p>
            <p>
              要移除位置，打开大纲视图并右键点击位置。上下文菜单会打开，提供移除位置的选项。您需要确认此操作。请注意，移除位置会删除可能附加到该位置图片的所有标签信息。图片本身在文件系统中当然会保留。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.dragAndDrop'),
        content: (
          <>
            <p>
              另一种快速导入图片的方式是将它们拖入应用程序窗口中的位置列表。您可以从文件资源管理器拖入，也可以从任何来源如网页浏览器拖入。当放置这些图片时，它们会被复制到您选择的（子）文件夹中。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.browserExtension'),
        content: (
          <>
            <p>
              为 FireFox 和基于 Chromium 的浏览器（如 Google Chrome 和 Edge）提供了浏览器扩展。它允许您直接从网页浏览器导入图片到 Allusion，并立即为它们添加标签。在设置窗口的“后台进程”部分可以找到更多信息。从{' '}
              <ExternalLink url={chromeExtensionUrl}>Chrome Webstore</ExternalLink> 或{' '}
              <ExternalLink url={firefoxExtensionUrl}>Firefox</ExternalLink> 获取扩展。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.tagImportExport'),
        content: (
          <>
            <p>
              您可以将 Allusion 内部数据库中存储的标签保存到图片文件的元数据中。这允许您在其他应用程序中查看它们，如文件浏览器和 Adobe Bridge 等工具。此选项在设置窗口的“导入/导出”部分可用。从文件元数据导入标签可以在同一位置进行。
              <br />
              请注意，只有画廊中显示的图片受这些操作影响！
            </p>
            <p>
              您也可以通过文件上下文菜单中的“标签”选项导入/导出选定文件的标签。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: i18n.t('helpcenter.tagging'),
    icon: IconSet.TAG,
    sections: [
      {
        title: i18n.t('helpcenter.tagSetup'),
        content: (
          <>
            <p>
              虽然可以在运行时创建标签，但建议在大纲视图中提前设置有用的标签，以充分利用可以创建的有组织的标签结构。大纲视图在位置下方有一个与标签相关的部分。在此部分中，您可以创建、编辑和组织您的标签。
            </p>
            <p>
              要创建新标签，只需点击标题旁边的加号图标。您需要将鼠标悬停在区域上，图标才会可见。或者右键点击标签，然后选择“新标签”以直接创建子标签。
            </p>
            <p>
              要组织您的标签，只需在大纲视图中拖动列表项。您可以将项放置到另一个项上以创建层次结构。通过这种方式，您可以将许多标签的列表转换为结构化形状，以便您轻松找到特定的标签。或者，您可以在文件标签编辑器中搜索标签，右键点击您正在搜索的标签，并选择“在标签面板中显示”以快速找到标签。
            </p>
            <p>
              您可以通过标签的属性编辑器设置别名、标签描述、隐含关系和其他设置。要打开它，使用上下文菜单选项“编辑标签”或选择标签并按下快捷键“4”。
            </p>
            <p>
              最后，要移除或编辑条目，右键点击它并从上下文菜单中选择操作。标签树还支持使用修饰键进行灵活选择：按住{' '}
              <strong>Alt</strong> 以选择整个标签集合（标签及其子标签）；否则，仅选择可见标签。按住 <strong>Command</strong>/
              <strong>Control</strong> 以启用加法/减法选择。按住{' '}
              <strong>Shift</strong> 以选择范围内的多个项。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.impliedAndInheritedTags'),
        content: (
          <>
            <p>
              您可以通过标签属性编辑器设置标签之间的隐含关系（右键点击“编辑标签”，或使用快捷键“4”）。为文件添加标签后，该文件还会自动继承该标签的所有上级标签和隐含标签（包括这些标签所隐含的标签），搜索时也会将它们纳入匹配范围。例如，如果标签 <em>dog</em> 隐含 <em>mammal</em>，而 <em>mammal</em> 隐含 <em>animal</em>，那么搜索 <em>animal</em> 时，带有 <em>dog</em> 标签的文件也会因这种隐含关系而出现在结果中。
            </p>
            <p>
              继承的标签无法从文件中移除，除非您移除所有导致它们被自动继承的标签。
            </p>
            <p>
              可以配置继承标签和集合的可见性。您可以决定哪些标签出现在文件缩略图和标签列表中，通过设置每个标签的“继承时可见”状态，使用标签的右键菜单或标签属性编辑器。您还可以在外观设置中配置全局继承标签可见性模式。可用模式包括：显示所有（即使“继承时可见”状态被禁用），仅显示“继承时可见”标签（默认模式），和不显示继承标签。
            </p>
            <p>
              当导出标签到文件元数据时，只有显式分配的标签会被导出到文件。自动继承的标签不会被包括，除非您显式地将它们分配给文件。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.howToTagAnImage'),
        content: (
          <>
            <p>有几种方式可以标记您的图片并高效管理您的素材库：</p>
            <ul>
              <li>
                <strong>拖放：</strong> 从大纲视图直接将标签拖到图片或多个图片的选择上。
              </li>
              <li>
                <strong>标签编辑器：</strong> 选择一张或多张图片，按下 <code>3</code> 打开标签编辑器，并从列表中添加或移除标签。
              </li>
              <li>
                <strong>检查器面板：</strong> 在右侧查看全尺寸图片时，直接在侧边栏的列表中添加标签。
              </li>
              <li>
                <strong>标记位置：</strong> 右键点击位置文件夹并选择{' '}
                <em>"编辑标签"</em> 以自动为包含在该文件夹中的所有文件分配特定标签。
              </li>
              <li>
                <strong>批量标签粘贴：</strong> 在标签编辑器中，您可以粘贴原始未结构化文本、逗号分隔的值或带换行符的文本，以快速识别并批量分配标签。
              </li>
              <li>
                <strong>本地标签服务：</strong> 您可以连接并触发外部标签工具，通过本地 HTTP 接口。要了解如何配置此集成，请查看 <em>"自动标签"</em> 部分。
              </li>
            </ul>

            <p>
              要从一张或多张图片中移除标签，您可以使用标签编辑器或检查器。在这两个地方，您都可以移除单个标签或清除选定图片上的整个标签集。
            </p>
            <p>
              使用标签编辑器时，您可以按住 <code>ALT + 方向键</code> 在画廊项之间导航，同时保持焦点在输入字段上。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.recentlyUsedTags'),
        content: (
          <>
            <p>
              当使用标签标记文件或进行快速搜索时，它会被添加到“最近使用的标签”列表。此列表会在所有标签选择器中作为初始建议显示，默认可以存储最多 10 个标签。这个数字可以更改，或者通过将其设置为 0 在“设置 &gt; 使用偏好 &gt; 最近使用的标签”部分完全禁用此功能。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.navigation'),
        content: (
          <>
            <p>
              当您拥有大量标签的素材库时，可能难以找到或记住标签在层次结构中的位置。在这种情况下，您可以在标签编辑器面板或文件中的分配标签中搜索标签，并右键点击它们以显示“在标签面板中显示”选项，快速找到标签。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.automaticTagging'),
        content: (
          <>
            <p>
              您可以设置一个端点指向本地托管的 AI 标签服务或任何自定义标签实现，允许应用程序发送请求并自动使用服务响应标记文件。您还可以配置同时发送到服务的并发请求数量。更多信息请查看设置窗口的“后台进程”部分。
            </p>
            <p>
              要自动标记选中的文件，请在文件右键菜单中选择“标记… &gt; 使用标签服务自动标记所选文件”。
            </p>
            <h4>API 实现规范</h4>
            <p>
              为了与应用程序正确交互，您的本地服务器必须暴露一个基础 URL（例如，<code>http://localhost:5000</code>）并实现以下两个
              <code>POST</code> 端点：
            </p>
            <h4>1. 核心标签端点（基础 URL）</h4>
            <p>
              应用程序为每个文件触发一个 <code>POST</code> 请求到基础 URL 以获取其生成的标签。
            </p>
            <div style={{ paddingLeft: '8px' }}>
              <strong>请求正文格式：</strong>
              <pre>{'{ "file": "<absolute_path>" }'}</pre>
              <strong>预期响应格式：</strong>
              <pre>
                {'{'}
                <br />
                {'  "tags": ['}
                <br />
                {'    { "name": "<tag1_name>" },'}
                <br />
                {'    { "name": "<tag2_name>" },'}
                <br />
                {'    ... etc.'}
                <br />
                {'  ]'}
                <br />
                {'}'}
              </pre>
            </div>
            <h4>2. 允许文件预筛选端点</h4>
            <p>
              在执行请求之前，应用程序通过 <code>POST</code> 请求访问 <code>/allowed-files/</code>{' '}
              子路径。这用于预先验证服务器能够处理哪些路径。
            </p>
            <div style={{ paddingLeft: '8px' }}>
              <strong>请求正文格式：</strong>
              <pre>
                {'{'}
                <br />
                {'  "files": ['}
                <br />
                {'    "<absolute_path_1>",'}
                <br />
                {'    "<absolute_path_2>",'}
                <br />
                {'    ...'}
                <br />
                {'  ]'}
                <br />
                {'}'}
              </pre>

              <strong>预期响应格式：</strong>
              <pre>
                {'{'}
                <br />
                {'  "allowed": ['}
                <br />
                {'    "<absolute_path_1>",'}
                <br />
                {'    ...'}
                <br />
                {'  ]'}
                <br />
                {'}'}
              </pre>
            </div>
            <p>您还可以使用快捷键 R 快速刷新画廊。</p>
          </>
        ),
      },
    ],
  },
  {
    title: i18n.t('helpcenter.extraProperties'),
    icon: IconSet.OUTLINER4,
    sections: [
      {
        title: i18n.t('helpcenter.extraProperties'),
        content: (
          <>
            <p>
              您可以使用额外的文件属性编辑器面板（快捷键 4）或检查器定义额外的属性并向文件添加值。额外的属性允许您存储与文件相关的附加信息，并可能用于进一步整理和组织您的素材库。
            </p>
            <p>
              要创建新的额外属性定义，前往额外的文件属性编辑器或检查器并点击“+”加号按钮。然后输入新属性的名称并选择可用的创建选项之一：目前，您可以定义类型为数字或文本的属性。
            </p>
            <p>
              要向文件或多个文件添加额外属性，首先选择要编辑的文件。然后，前往额外的文件属性编辑器或检查器并点击“+”按钮打开额外属性选择器。您可以使用文本输入搜索特定属性，并选择要添加的属性。
            </p>
            <p>
              要编辑文件或选定文件组的额外属性值，只需在额外的文件属性编辑器或检查器中输入新值。数字类型属性支持正小数，文本类型属性支持多行输入（按 Enter 创建新行）。
            </p>
            <p>
              要重命名、从文件中移除或删除额外属性定义，右键点击额外的文件属性编辑器或额外属性选择器中的属性。
            </p>
            <p>
              您可以使用“按”选项在上下文菜单或工具栏的“排序视图内容”面板中按额外属性值对文件进行排序。
            </p>
            <p>
              您还可以使用额外属性创建高级搜索条件，并根据其值过滤文件。
            </p>
            <p>
              额外的属性在导入/导出设置菜单中使用“导出标签到文件元数据”选项时会被导出到文件元数据中。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: i18n.t('helpcenter.search'),
    icon: IconSet.SEARCH,
    sections: [
      {
        title: i18n.t('helpcenter.quickSearch'),
        content: (
          <>
            <p>
              在 Allusion 中有几种方式可以找到特定图片。默认情况下，搜索栏允许您根据标签查找图片。您可以按下 Ctrl-F 快速聚焦到搜索栏。高级搜索可以从 Allusion 右上角的三点图标访问，或者按下 Ctrl-Shift-F。
            </p>
            <p>
              工具栏中始终可见的搜索栏是最快的搜索方式。一旦开始输入，Allusion 会提供建议，并显示任何父标签。从列表中选择项以将其添加到搜索中。您可以通过同时搜索多个标签来缩小图片范围。如果搜索两个标签，默认情况下，Allusion 会返回所有同时具有这两个标签的图片。您可以使用搜索栏右侧的两个圆圈图标更改此行为，以返回所有具有任一标签的图片。最后请记住，Allusion 默认会递归搜索子标签。您可以使用高级搜索排除子标签。
            </p>
            <p>
              如果在选择搜索栏时按下 Alt，会出现一个替代菜单，允许您基于搜索栏中的文本快速创建不同类型的搜索条件，如搜索额外属性或文件路径中的文本/值。
            </p>
            <p>您还可以使用快捷键 R 快速刷新画廊。</p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.advancedSearchSection'),
        content: (
          <>
            <p>
              高级搜索可以通过按下 Allusion 右上角的三点图标或使用 Ctrl-Shift-F 快捷键打开。在该窗口中，您可以通过列出它们来创建尽可能多的搜索条件。在高级搜索的“条件构建器”部分输入您的条件。然后使用右侧的加号图标将完成的条件添加到下方的查询编辑器中。点击搜索会返回所有与查询编辑器中的条件匹配的图片，而不是与条件构建器中输入的内容匹配。
            </p>
            <p>
              为了更详细地查看，界面上的每一行代表一个条件，由三个输入字段组成。首先选择您想要查找的信息类型。您可以搜索标签和文件属性，如名称、大小、类型和创建日期。然后选择操作符，如“等于”、“大于”、“包含”等。最后输入您想要查找的选定属性的值。添加多个条件会帮助您进一步缩小搜索结果。
            </p>
            <p>
              为了在搜索时提供额外控制，您可以切换查找匹配所有输入查询的图片，或匹配任一查询的图片。此切换选项位于高级搜索面板底部，以及在搜索栏右侧，当输入两个或更多查询时。
            </p>
          </>
        ),
      },
    ],
  },
  {
    title: i18n.t('helpcenter.inspection'),
    icon: IconSet.INFO,
    sections: [
      {
        title: i18n.t('helpcenter.contentArea'),
        content: (
          <>
            <p>
              内容区域是图片在窗口中心列出的区域。您可以在工具栏中设置多个偏好，影响图片的列出方式。您可以使用工具栏中的下拉菜单选择多种视图模式，或者在内容区域中右键点击。您还可以根据各种条件对图片进行排序。最后，您可以更改缩略图的大小。这也可以在上下文菜单和设置菜单中更改。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.imageDetails'),
        content: (
          <>
            <p>
              每张图片都携带大量信息，如文件名、URL、尺寸等。这些信息可以通过检查器查看。检查器是一个面板，在查看全尺寸图片时显示，可以通过在图片的上下文菜单中选择该选项，或者双击图片来打开。此面板允许您查看文件的元数据以及分配给图片的标签和评分。如果检查器在查看全尺寸图片时不可见，请在工具栏中找到信息图标。
            </p>
          </>
        ),
      },
      {
        title: i18n.t('helpcenter.imagePreviewWindow'),
        content: (
          <>
            <p>
              您也可以通过选择图片并按下空格键在单独的窗口中预览图片。预览窗口会打开并显示您的图片。但请注意，预览窗口仅允许您在选定图片之间循环。因此，您可以选择多张图片并在新的窗口中预览它们。再次按下空格键关闭窗口。
            </p>
          </>
        ),
      },
    ],
  },
];
