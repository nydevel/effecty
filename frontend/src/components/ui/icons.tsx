import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FilePlus2,
  FolderPlus,
  GripVertical,
  Link2,
  List,
  Loader2,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ReactElement } from 'react';
import type { AppIconProps } from './AppIcon';
import { renderAppIcon } from './AppIcon';

type IconComponent = (props: AppIconProps) => ReactElement;

function makeLegacyIcon(icon: Parameters<typeof renderAppIcon>[0]['icon']): IconComponent {
  return function LegacyIcon(props: AppIconProps) {
    return renderAppIcon({ icon, ...props });
  };
}

export const PlusOutlined = makeLegacyIcon(Plus);
export const EditOutlined = makeLegacyIcon(Pencil);
export const DeleteOutlined = makeLegacyIcon(Trash2);
export const CheckOutlined = makeLegacyIcon(Check);
export const CloseOutlined = makeLegacyIcon(X);
export const HolderOutlined = makeLegacyIcon(GripVertical);
export const LinkOutlined = makeLegacyIcon(Link2);
export const SendOutlined = makeLegacyIcon(Send);
export const UploadOutlined = makeLegacyIcon(Upload);
export const DownloadOutlined = makeLegacyIcon(Download);
export const FolderAddOutlined = makeLegacyIcon(FolderPlus);
export const FileAddOutlined = makeLegacyIcon(FilePlus2);
export const UnorderedListOutlined = makeLegacyIcon(List);
export const CopyOutlined = makeLegacyIcon(Copy);
export const LeftOutlined = makeLegacyIcon(ChevronLeft);
export const RightOutlined = makeLegacyIcon(ChevronRight);
export const LoadingOutlined = makeLegacyIcon(Loader2);
