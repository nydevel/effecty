import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { Tree, type NodeRendererProps, type TreeApi } from 'react-arborist';
import { PlusOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { MaterialStatus, Topic } from '../api/learning';
import AppButton from './ui/AppButton';

interface TopicNode {
  id: string;
  name: string;
  children?: TopicNode[];
}

interface Props {
  topics: Topic[];
  selectedId: string | null;
  statusFilter: MaterialStatus | 'all';
  onSelect: (id: string | null) => void;
  onStatusFilterChange: (status: MaterialStatus | 'all') => void;
  onCreate: (parentIdOverride?: string | null) => void;
  onMove: (id: string, parentId: string | null) => void;
  onDropMaterial?: (materialId: string, topicId: string) => void;
  onDelete: (id: string) => void;
}

function buildTree(topics: Topic[]): TopicNode[] {
  const nodes = new Map<string, TopicNode>();
  const roots: TopicNode[] = [];

  for (const topic of topics) {
    nodes.set(topic.id, { id: topic.id, name: topic.name, children: [] });
  }

  for (const topic of topics) {
    const node = nodes.get(topic.id)!;
    if (topic.parent_id && nodes.has(topic.parent_id)) {
      nodes.get(topic.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (list: TopicNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name));
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        sortTree(node.children);
      }
    }
  };

  sortTree(roots);
  return roots;
}

export default function TopicSidebar({
  topics,
  selectedId,
  statusFilter,
  onSelect,
  onStatusFilterChange,
  onCreate,
  onMove,
  onDropMaterial,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const treeRef = useRef<TreeApi<TopicNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const [controlsHeight, setControlsHeight] = useState(44);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [materialDropTargetId, setMaterialDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTreeHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setControlsHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const treeData = buildTree(topics);

  const extractMaterialId = (dataTransfer: DataTransfer): string | null => {
    const direct = dataTransfer.getData('application/material-id');
    if (direct) return direct;
    const plain = dataTransfer.getData('text/plain');
    if (plain.startsWith('material:')) {
      return plain.slice('material:'.length);
    }
    return null;
  };

  const isMaterialDrag = (dataTransfer: DataTransfer): boolean => {
    const types = Array.from(dataTransfer.types || []);
    if (types.includes('application/material-id')) return true;
    if (!types.includes('text/plain')) return false;
    const plain = dataTransfer.getData('text/plain');
    return plain.startsWith('material:');
  };

  function Node({ node, style, dragHandle }: NodeRendererProps<TopicNode>) {
    const nodeStyle = {
      ...style,
      paddingLeft: `${10 + node.level * 16}px`,
    };

    return (
      <Dropdown
        menu={{
          items: [
            {
              key: 'create-child-topic',
              label: t('learning.newTopic'),
              onClick: () => onCreate(node.id),
            },
            {
              key: 'delete',
              label: t('learning.delete'),
              danger: true,
              onClick: () => onDelete(node.id),
            },
          ],
        }}
        trigger={['contextMenu']}
      >
        <div
          className={`topic-list-item tree-node topic-tree-node ${node.isSelected ? 'selected' : ''} ${materialDropTargetId === node.id ? 'drag-over' : ''}`}
          style={nodeStyle}
          ref={dragHandle}
          onClick={() => node.select()}
          onDragStart={(e) => {
            e.dataTransfer.setData('application/topic-id', node.id);
          }}
          onDragOver={(e) => {
            if (!onDropMaterial) return;
            if (!isMaterialDrag(e.dataTransfer)) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (materialDropTargetId !== node.id) {
              setMaterialDropTargetId(node.id);
            }
          }}
          onDragLeave={() => {
            if (materialDropTargetId === node.id) {
              setMaterialDropTargetId(null);
            }
          }}
          onDrop={(e) => {
            if (!onDropMaterial) return;
            const materialId = extractMaterialId(e.dataTransfer);
            if (!materialId) return;
            e.preventDefault();
            e.stopPropagation();
            setMaterialDropTargetId(null);
            onDropMaterial(materialId, node.id);
          }}
        >
          <span className="tree-node-name">{node.data.name || t('learning.untitled')}</span>
        </div>
      </Dropdown>
    );
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">{t('iconBar.learning')}</div>
        <AppButton
          type="text"
          className="sidebar-add-btn"
          icon={<PlusOutlined />}
          size="small"
          onClick={() => onCreate()}
        >
          {t('learning.newTopic')}
        </AppButton>
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
        onDragLeave={() => {
          setMaterialDropTargetId(null);
        }}
        onDrop={() => {
          setMaterialDropTargetId(null);
        }}
      >
        <div ref={controlsRef} className="topic-sidebar-controls">
          <div className="topic-status-filter">
            <div className="sidebar-title topic-status-filter-title">{t('learning.status')}</div>
            <div
              className={`topic-list-item ${statusFilter === 'all' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusFilterChange('all');
              }}
            >
              {t('learning.allStatuses')}
            </div>
            <div
              className={`topic-list-item ${statusFilter === 'not_started' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusFilterChange('not_started');
              }}
            >
              {t('learning.statusNotStarted')}
            </div>
            <div
              className={`topic-list-item ${statusFilter === 'in_progress' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusFilterChange('in_progress');
              }}
            >
              {t('learning.statusInProgress')}
            </div>
            <div
              className={`topic-list-item ${statusFilter === 'completed' ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onStatusFilterChange('completed');
              }}
            >
              {t('learning.statusCompleted')}
            </div>
          </div>

          <div
            className={`topic-list-item ${selectedId === null ? 'selected' : ''} ${rootDragOver ? 'drag-over' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              treeRef.current?.deselectAll();
              onSelect(null);
            }}
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes('application/topic-id')) {
                setRootDragOver(false);
                return;
              }
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setRootDragOver(true);
            }}
            onDragLeave={() => setRootDragOver(false)}
            onDrop={(e) => {
              const draggedTopicId = e.dataTransfer.getData('application/topic-id');
              if (!draggedTopicId) return;
              e.preventDefault();
              setRootDragOver(false);
              onMove(draggedTopicId, null);
            }}
          >
            {t('learning.allMaterials')}
          </div>
        </div>

        <Tree<TopicNode>
          ref={treeRef}
          data={treeData}
          width="100%"
          height={Math.max(120, treeHeight - controlsHeight)}
          indent={18}
          rowHeight={34}
          selection={selectedId ?? undefined}
          onSelect={(nodes) => {
            if (nodes.length > 0) {
              onSelect(nodes[0].id);
            } else {
              onSelect(null);
            }
          }}
          onMove={({ dragIds, parentId }) => {
            for (const id of dragIds) {
              onMove(id, parentId);
            }
          }}
        >
          {Node}
        </Tree>
      </div>
    </div>
  );
}
