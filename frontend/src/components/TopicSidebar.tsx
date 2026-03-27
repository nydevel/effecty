import { useEffect, useRef, useState } from 'react';
import { Dropdown } from 'antd';
import { Tree, type NodeRendererProps, type TreeApi } from 'react-arborist';
import { PlusOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Topic } from '../api/learning';
import AppButton from './ui/AppButton';

interface TopicNode {
  id: string;
  name: string;
  children?: TopicNode[];
}

interface Props {
  topics: Topic[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  onMove: (id: string, parentId: string | null) => void;
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
  onSelect,
  onCreate,
  onMove,
  onDelete,
}: Props) {
  const { t } = useTranslation();
  const treeRef = useRef<TreeApi<TopicNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(400);
  const [rootDragOver, setRootDragOver] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setTreeHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const treeData = buildTree(topics);

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
          className={`topic-list-item tree-node topic-tree-node ${node.isSelected ? 'selected' : ''}`}
          style={nodeStyle}
          ref={dragHandle}
          onClick={() => node.select()}
          onDragStart={(e) => {
            e.dataTransfer.setData('application/topic-id', node.id);
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
          onClick={onCreate}
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
      >
        <div
          className={`topic-list-item ${selectedId === null ? 'selected' : ''} ${rootDragOver ? 'drag-over' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            treeRef.current?.deselectAll();
            onSelect(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setRootDragOver(true);
          }}
          onDragLeave={() => setRootDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setRootDragOver(false);
            const draggedTopicId = e.dataTransfer.getData('application/topic-id');
            if (draggedTopicId) {
              onMove(draggedTopicId, null);
            }
          }}
        >
          {t('learning.allMaterials')}
        </div>

        <Tree<TopicNode>
          ref={treeRef}
          data={treeData}
          width="100%"
          height={Math.max(120, treeHeight - 44)}
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
