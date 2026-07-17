import {
  buildNavigationTree,
  documentTitle,
  type NavigationNode,
} from "../../lib/content/navigation-tree";
import { documentHref } from "../../lib/content/paths";
import type { ContentManifest } from "../../lib/content/types";

interface DocumentIndexProps {
  manifest: ContentManifest;
  documentHrefFor?: (path: string) => string;
}

export function DocumentIndex({
  manifest,
  documentHrefFor = documentHref,
}: DocumentIndexProps) {
  const tree = buildNavigationTree(manifest);

  const renderNodes = (nodes: NavigationNode[]) => (
    <ul>
      {nodes.map((node) =>
        node.type === "folder" ? (
          <li className="index-folder" key={node.path}>
            <strong>{node.name}</strong>
            {renderNodes(node.children)}
          </li>
        ) : (
          <li className="index-document" key={node.file.path}>
            <a href={documentHrefFor(node.file.path)}>{documentTitle(node.file)}</a>
          </li>
        ),
      )}
    </ul>
  );

  if (tree.length === 0) {
    return <p className="document-index-empty">暂无可用文档。</p>;
  }

  return (
    <nav className="document-index" aria-label="文档索引">
      {renderNodes(tree)}
    </nav>
  );
}
