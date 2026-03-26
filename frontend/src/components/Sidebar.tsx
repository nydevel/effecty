import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Dropdown } from 'antd';
import { FolderAddOutlined, FileAddOutlined, UnorderedListOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Tree, type TreeApi, type NodeRendererProps } from 'react-arborist';
import { useTranslation } from 'react-i18next';
import type { Note } from '../api/notes';

export interface TreeNode {
  id: string;
  name: string;
  nodeType: 'folder' | 'file' | 'memolist';
  children?: TreeNode[];
}

interface Props {
  notes: Note[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreateFolder: () => void;
  onCreateFile: () => void;
  onCreateMemolist?: () => void;
  onMove: (id: string, parentId: string | null, index: number) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
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

function getNodeIcon(nodeType: string, isOpen: boolean): string {
  if (nodeType === 'folder') return isOpen ? '📂' : '📁';
  if (nodeType === 'memolist') return '📋';
  return '📄';
}

export default function Sidebar({
  notes,
  selectedId,
  onSelect,
  onCreateFolder,
  onCreateFile,
  onCreateMemolist,
  onMove,
  onRename,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const treeData = buildTree(notes);
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTreeHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const getContextMenuItems = useCallback(
    (nodeId: string) => ({
      items: [
        {
          key: 'rename',
          label: t('notes.rename'),
          icon: <EditOutlined />,
          onClick: () => {
            requestAnimationFrame(() => {
              treeRef.current?.edit(nodeId);
            });
          },
        },
        {
          key: 'delete',
          label: t('notes.delete'),
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onDelete(nodeId),
        },
      ],
    }),
    [onDelete],
  );

  function Node({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
    const isFolder = node.data.nodeType === 'folder';
    return (
      <Dropdown menu={getContextMenuItems(node.id)} trigger={['contextMenu']}>
        <div
          className={`tree-node ${node.isSelected ? 'selected' : ''}`}
          style={style}
          ref={dragHandle}
          onClick={() => { node.select(); if (isFolder) node.toggle(); }}
          onDoubleClick={() => node.edit()}
        >
          <span className="tree-node-icon">{getNodeIcon(node.data.nodeType, node.isOpen)}</span>
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
      </Dropdown>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">{t('iconBar.notes')}</div>
        <div className="sidebar-header-actions">
          <Button
            type="text"
            className="sidebar-tool-btn"
            size="small"
            icon={<FolderAddOutlined />}
            onClick={onCreateFolder}
            title={t('notes.newFolder')}
          />
          <Button
            type="text"
            className="sidebar-tool-btn"
            size="small"
            icon={<FileAddOutlined />}
            onClick={onCreateFile}
            title={t('notes.newFile')}
          />
          {onCreateMemolist && (
            <Button
              type="text"
              className="sidebar-tool-btn"
              size="small"
              icon={<UnorderedListOutlined />}
              onClick={onCreateMemolist}
              title={t('notes.newMemolist')}
            />
          )}
        </div>
      </div>
      <div
        ref={containerRef}
        className="sidebar-tree"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target === e.currentTarget || !target.closest('.tree-node')) {
            treeRef.current?.deselectAll();
            onSelect(null);
          }
        }}
      >
        <Tree<TreeNode>
          ref={treeRef}
          data={treeData}
          width="100%"
          height={treeHeight}
          indent={20}
          rowHeight={32}
          selection={selectedId ?? undefined}
          onSelect={(nodes) => {
            if (nodes.length > 0) {
              onSelect(nodes[0].id);
            } else {
              onSelect(null);
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
    </div>
  );
}
