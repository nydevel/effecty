import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button, Input, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { RoadmapNode } from '../api/learning';
import * as learningApi from '../api/learning';

interface RoadmapNodeData {
  label: string;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, label: string) => void;
  [key: string]: unknown;
}

function RoadmapNodeComponent({ id, data }: NodeProps<Node<RoadmapNodeData>>) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(data.label);

  const handleSave = () => {
    if (editLabel.trim()) {
      data.onRename(id, editLabel.trim());
    }
    setEditing(false);
  };

  return (
    <div className="roadmap-node">
      <Handle type="target" position={Position.Bottom} />
      {editing ? (
        <div className="roadmap-node-edit">
          <Input
            size="small"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onPressEnter={handleSave}
            autoFocus
          />
          <Button size="small" type="text" icon={<CheckOutlined />} onClick={handleSave} />
        </div>
      ) : (
        <div className="roadmap-node-label">{data.label}</div>
      )}
      <div className="roadmap-node-actions">
        <Button
          size="small"
          type="text"
          icon={<PlusOutlined />}
          onClick={() => data.onAddChild(id)}
          title={t('learning.roadmapAddChild')}
        />
        <Button
          size="small"
          type="text"
          icon={<EditOutlined />}
          onClick={() => { setEditLabel(data.label); setEditing(true); }}
          title={t('learning.edit')}
        />
        <Popconfirm
          title={t('learning.roadmapDeleteConfirm')}
          onConfirm={() => data.onDelete(id)}
          okText={t('learning.delete')}
          cancelText={t('learning.cancel')}
        >
          <Button
            size="small"
            type="text"
            danger
            icon={<DeleteOutlined />}
            title={t('learning.delete')}
          />
        </Popconfirm>
      </div>
      <Handle type="source" position={Position.Top} />
    </div>
  );
}

const nodeTypes = { roadmap: RoadmapNodeComponent };

const VERTICAL_SPACING = 150;
const HORIZONTAL_SPACING = 200;

function layoutNodes(apiNodes: RoadmapNode[]): { nodes: Node<RoadmapNodeData>[]; edges: Edge[] } {
  const childrenMap = new Map<string | null, RoadmapNode[]>();
  const nodeMap = new Map<string, RoadmapNode>();

  for (const n of apiNodes) {
    nodeMap.set(n.id, n);
    const parentKey = n.parent_id;
    if (!childrenMap.has(parentKey)) {
      childrenMap.set(parentKey, []);
    }
    childrenMap.get(parentKey)!.push(n);
  }

  // Find roots (nodes with no parent)
  const roots = childrenMap.get(null) ?? [];

  const nodes: Node<RoadmapNodeData>[] = [];
  const edges: Edge[] = [];

  // BFS to assign positions bottom-to-top
  // First compute subtree widths
  function subtreeWidth(nodeId: string): number {
    const children = childrenMap.get(nodeId) ?? [];
    if (children.length === 0) return 1;
    let width = 0;
    for (const child of children) {
      width += subtreeWidth(child.id);
    }
    return width;
  }

  function layoutSubtree(
    nodeId: string,
    depth: number,
    xOffset: number,
    callbacks: RoadmapNodeData,
  ): number {
    const node = nodeMap.get(nodeId)!;
    const children = childrenMap.get(nodeId) ?? [];
    const width = subtreeWidth(nodeId);

    const x = xOffset + (width * HORIZONTAL_SPACING) / 2 - HORIZONTAL_SPACING / 2;
    const y = -depth * VERTICAL_SPACING;

    nodes.push({
      id: nodeId,
      type: 'roadmap',
      position: { x, y },
      data: { ...callbacks, label: node.label },
    });

    if (node.parent_id) {
      edges.push({
        id: `e-${node.parent_id}-${nodeId}`,
        source: node.parent_id,
        target: nodeId,
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }

    let currentX = xOffset;
    for (const child of children) {
      const childWidth = subtreeWidth(child.id);
      layoutSubtree(child.id, depth + 1, currentX, callbacks);
      currentX += childWidth * HORIZONTAL_SPACING;
    }

    return width;
  }

  // Placeholder callbacks - will be replaced
  const placeholderCallbacks: RoadmapNodeData = {
    label: '',
    onAddChild: () => {},
    onDelete: () => {},
    onRename: () => {},
  };

  let currentX = 0;
  for (const root of roots) {
    const width = subtreeWidth(root.id);
    layoutSubtree(root.id, 0, currentX, placeholderCallbacks);
    currentX += width * HORIZONTAL_SPACING;
  }

  return { nodes, edges };
}

export default function RoadmapCanvas() {
  const { t } = useTranslation();
  const [apiNodes, setApiNodes] = useState<RoadmapNode[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<RoadmapNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const loadNodes = useCallback(async () => {
    try {
      const list = await learningApi.listRoadmapNodes();
      setApiNodes(list);
    } catch (err) {
      console.error('Failed to load roadmap nodes:', err);
    }
  }, []);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const handleAddChild = useCallback(async (parentId: string) => {
    try {
      await learningApi.createRoadmapNode({
        parent_id: parentId,
        label: t('learning.roadmapNewNode'),
        position_x: 0,
        position_y: 0,
      });
      await loadNodes();
    } catch (err) {
      console.error('Failed to create roadmap node:', err);
    }
  }, [loadNodes, t]);

  const handleAddRoot = useCallback(async () => {
    try {
      await learningApi.createRoadmapNode({
        parent_id: null,
        label: t('learning.roadmapNewNode'),
        position_x: 0,
        position_y: 0,
      });
      await loadNodes();
    } catch (err) {
      console.error('Failed to create root node:', err);
    }
  }, [loadNodes, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await learningApi.deleteRoadmapNode(id);
      await loadNodes();
    } catch (err) {
      console.error('Failed to delete roadmap node:', err);
    }
  }, [loadNodes]);

  const handleRename = useCallback(async (id: string, label: string) => {
    try {
      await learningApi.updateRoadmapNode(id, { label });
      await loadNodes();
    } catch (err) {
      console.error('Failed to rename roadmap node:', err);
    }
  }, [loadNodes]);

  // Re-layout when apiNodes change
  useEffect(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = layoutNodes(apiNodes);

    // Inject real callbacks
    const withCallbacks = layoutedNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onAddChild: handleAddChild,
        onDelete: handleDelete,
        onRename: handleRename,
      },
    }));

    setNodes(withCallbacks);
    setEdges(layoutedEdges);
  }, [apiNodes, handleAddChild, handleDelete, handleRename, setNodes, setEdges]);

  const handleNodeDragStop = useCallback(async (_event: React.MouseEvent, node: Node) => {
    try {
      await learningApi.updateRoadmapNode(node.id, {
        position_x: node.position.x,
        position_y: node.position.y,
      });
    } catch (err) {
      console.error('Failed to update node position:', err);
    }
  }, []);

  return (
    <div className="roadmap-canvas">
      <div className="roadmap-toolbar">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddRoot}
        >
          {t('learning.roadmapAddRoot')}
        </Button>
      </div>
      <div className="roadmap-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          }}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
