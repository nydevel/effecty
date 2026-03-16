import { Button, Dropdown } from 'antd';
import {
  LinkOutlined,
  YoutubeOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Material } from '../api/learning';

interface Props {
  material: Material;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleDone: (id: string) => void;
}

function getThumbnailUrl(material: Material): string | null {
  if (material.thumbnail_path) {
    return `/uploads/${material.thumbnail_path}`;
  }
  return null;
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'article_link':
      return <LinkOutlined style={{ fontSize: 32, color: '#4a90d9' }} />;
    case 'video_link':
      return <YoutubeOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />;
    case 'text':
      return <FileTextOutlined style={{ fontSize: 32, color: '#52c41a' }} />;
    case 'image':
      return <FileImageOutlined style={{ fontSize: 32, color: '#722ed1' }} />;
    case 'document':
      return <FilePdfOutlined style={{ fontSize: 32, color: '#fa8c16' }} />;
    default:
      return <FileTextOutlined style={{ fontSize: 32, color: '#999' }} />;
  }
}

export default function MaterialCard({ material, onEdit, onDelete, onToggleDone }: Props) {
  const { t } = useTranslation();
  const thumbUrl = getThumbnailUrl(material);
  const showThumbnail =
    thumbUrl && ['article_link', 'video_link', 'image'].includes(material.material_type);

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: t('learning.edit'),
            onClick: () => onEdit(material.id),
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: t('learning.delete'),
            danger: true,
            onClick: () => onDelete(material.id),
          },
        ],
      }}
      trigger={['contextMenu']}
    >
      <div className={`material-card${material.is_done ? ' material-card--done' : ''}`}>
        <div className="material-card-thumb">
          {showThumbnail ? (
            <img src={thumbUrl} alt={material.title} />
          ) : (
            getTypeIcon(material.material_type)
          )}
        </div>
        <div className="material-card-body">
          <div className="material-card-title">
            {material.title || t('learning.untitled')}
          </div>
          <div className="material-card-type">
            {t(`learning.${material.material_type}`)}
          </div>
        </div>
        <div className="material-card-actions">
          <button
            className={`material-done-btn${material.is_done ? ' material-done-btn--checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone(material.id);
            }}
            title={material.is_done ? t('learning.mark_undone') : t('learning.mark_done')}
          >
            {material.is_done && <CheckOutlined />}
          </button>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(material.id);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(material.id);
            }}
          />
        </div>
      </div>
    </Dropdown>
  );
}
