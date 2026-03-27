import AppButton from './ui/AppButton';
import { Table } from 'antd';
import { DeleteOutlined } from './ui/icons';
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

const TYPE_COLORS: Record<string, string> = {
  article_link: '#4f98a3',
  video_link: '#c8920a',
  text: '#52c41a',
  image: '#722ed1',
  document: '#fa8c16',
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

  const cycleStatus = (record: Material) => {
    const idx = STATUS_CYCLE.indexOf(record.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(record.id, next);
  };

  const columns: ColumnsType<Material> = [
    {
      title: t('learning.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => (
        <span style={{ fontWeight: 500, fontSize: 13 }}>
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
          <span
            className="material-type-dot"
            style={{ background: TYPE_COLORS[type] || '#999' }}
          />
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
          className={`status-badge status-badge-${status}`}
          onClick={(e) => {
            e.stopPropagation();
            cycleStatus(record);
          }}
          style={{ cursor: 'pointer' }}
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
              <span style={{ fontSize: 12, color: '#888' }}>{text}</span>
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
          onClick: () => onSelect(record.id),
        })}
      />
    </div>
  );
}
