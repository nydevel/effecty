import AppButton from './ui/AppButton';
import { Table } from 'antd';
import { DeleteOutlined, HolderOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { ColumnsType } from 'antd/es/table';
import type { Material, MaterialStatus } from '../api/learning';

interface Props {
  materials: Material[];
  selectedId: string | null;
  showTopics: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: MaterialStatus) => void;
}

const TYPE_CLASSNAMES: Record<string, string> = {
  article_link: 'material-type-dot-article_link',
  video_link: 'material-type-dot-video_link',
  text: 'material-type-dot-text',
  image: 'material-type-dot-image',
  document: 'material-type-dot-document',
};

const STATUS_CYCLE: MaterialStatus[] = ['not_started', 'in_progress', 'completed'];

export default function MaterialTable({
  materials,
  selectedId,
  showTopics,
  onSelect,
  onDelete,
  onStatusChange,
}: Props) {
  const { t } = useTranslation();

  const setMaterialDragPayload = (dataTransfer: DataTransfer, materialId: string) => {
    dataTransfer.effectAllowed = 'move';
    dataTransfer.setData('application/material-id', materialId);
    dataTransfer.setData('text/plain', `material:${materialId}`);
  };

  const cycleStatus = (record: Material) => {
    const idx = STATUS_CYCLE.indexOf(record.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(record.id, next);
  };

  const columns: ColumnsType<Material> = [
    {
      title: '',
      key: 'drag',
      width: 32,
      render: (_: unknown, record: Material) => (
        <span
          className="memo-drag-handle material-drag-handle"
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setMaterialDragPayload(e.dataTransfer, record.id);
          }}
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: t('learning.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <span className="material-title-cell">
          {text || t('learning.untitled')}
        </span>
      ),
    },
    {
      title: t('learning.type'),
      dataIndex: 'material_type',
      key: 'material_type',
      width: 130,
      render: (type: string) => (
        <span className="material-type-cell">
          <span className={`material-type-dot ${TYPE_CLASSNAMES[type] || 'material-type-dot-default'}`} />
          {t(`learning.${type}`)}
        </span>
      ),
    },
    {
      title: t('learning.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: MaterialStatus, record: Material) => (
        <span
          className={`status-badge status-badge-${status} material-status-clickable`}
          onClick={(e) => {
            e.stopPropagation();
            cycleStatus(record);
          }}
        >
          {status === 'not_started' && t('learning.statusNotStarted')}
          {status === 'in_progress' && t('learning.statusInProgress')}
          {status === 'completed' && t('learning.statusCompleted')}
        </span>
      ),
    },
    ...(showTopics
      ? [
          {
            title: t('learning.topic'),
            dataIndex: 'topic_names',
            key: 'topic_names',
            width: 200,
            ellipsis: true,
            render: (text: string) => (
              <span className="material-topic-text">{text}</span>
            ),
          } as const,
        ]
      : []),
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: Material) => (
        <AppButton
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(record.id);
          }}
        />
      ),
    },
  ];

  return (
    <div className="materials-table-wrap">
      <Table
        dataSource={materials}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={false}
        rowClassName={(record) => (record.id === selectedId ? 'ant-table-row-selected' : '')}
        onRow={(record) => ({
          draggable: true,
          onDragStart: (e) => {
            setMaterialDragPayload(e.dataTransfer, record.id);
          },
          onClick: () => onSelect(record.id),
        })}
      />
    </div>
  );
}
