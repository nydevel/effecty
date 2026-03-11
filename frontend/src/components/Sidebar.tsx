import { type MouseEvent, useCallback, useRef, useState } from 'react';
import { Tree, type TreeApi, type NodeRendererProps } from 'react-arborist';
import type { Note } from '../api/notes';

export interface TreeNode {
  id: string;
  name: string;
  nodeType: 'folder' | 'file';
  children?: TreeNode[];
}

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateFolder: () => void;
  onCreateFile: () => void;
  onMove: (id: string, parentId: string | null, index: number) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

interface ContextMenu {
  x: number;
  y: number;
  nodeId: string;
}

function buildTree(notes: Note[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const note of notes) {
    map.set(note.id, {
      id: note.id,
      name: note.title,
      nodeType: note.node_type,
      children: note.node_type === 'folder' ? [] : undefined,
    });
  }

  for (const note of notes) {
    const node = map.get(note.id)!;
    if (note.parent_id && map.has(note.parent_id)) {
      map.get(note.parent_id)!.children?.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export default function Sidebar({
  notes,
  selectedId,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onMove,
  onRename,
  onDelete,
}: Props) {
  const treeData = buildTree(notes);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);

  const closeMenu = useCallback(() => setContextMenu(null), []);

  const handleContextMenu = useCallback((e: MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  const handleRenameClick = useCallback(() => {
    if (!contextMenu) return;
    const nodeId = contextMenu.nodeId;
    closeMenu();
    requestAnimationFrame(() => {
      treeRef.current?.edit(nodeId);
    });
  }, [contextMenu, closeMenu]);

  const handleDeleteClick = useCallback(() => {
    if (!contextMenu) return;
    onDelete(contextMenu.nodeId);
    closeMenu();
  }, [contextMenu, onDelete, closeMenu]);

  function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
    const isFolder = node.data.nodeType === 'folder';
    return (
      <div
        className={`tree-node ${node.isSelected ? 'selected' : ''}`}
        style={style}
        ref={dragHandle}
        onClick={() => node.select()}
        onDoubleClick={() => node.edit()}
        onContextMenu={(e) => {
          node.select();
          handleContextMenu(e, node.id);
        }}
      >
        <span className="tree-node-icon">{isFolder ? (node.isOpen ? '📂' : '📁') : '📄'}</span>
        {node.isEditing ? (
          <input
            className="tree-node-input"
            type="text"
            defaultValue={node.data.name}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => node.reset()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') node.submit(e.currentTarget.value);
              if (e.key === 'Escape') node.reset();
            }}
            autoFocus
          />
        ) : (
          <span className="tree-node-name">{node.data.name}</span>
        )}
      </div>
    );
  }

  return (
    <div className="sidebar" onClick={closeMenu}>
      <div className="sidebar-header">
        <button className="sidebar-btn" onClick={onCreateFolder} title="New folder">
          📁+
        </button>
        <button className="sidebar-btn" onClick={onCreateFile} title="New file">
          📄+
        </button>
      </div>
      <div className="sidebar-tree">
        <Tree<TreeNode>
          ref={treeRef}
          data={treeData}
          width="100%"
          indent={20}
          rowHeight={32}
          selection={selectedId ?? undefined}
          onSelect={(nodes) => {
            if (nodes.length > 0) {
              onSelect(nodes[0].id);
            }
          }}
          onMove={({ dragIds, parentId, index }) => {
            for (const id of dragIds) {
              onMove(id, parentId, index);
            }
          }}
          onRename={({ id, name }) => onRename(id, name)}
          onDelete={({ ids }) => {
            for (const id of ids) {
              onDelete(id);
            }
          }}
        >
          {Node}
        </Tree>
      </div>

      {contextMenu && (
        <div
          className="context-menu-overlay"
          onClick={closeMenu}
          onContextMenu={(e) => { e.preventDefault(); closeMenu(); }}
        >
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="context-menu-item" onClick={handleRenameClick}>
              Rename
            </button>
            <button className="context-menu-item danger" onClick={handleDeleteClick}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
