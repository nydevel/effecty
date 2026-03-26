import type { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  dragOver?: boolean;
  clickable?: boolean;
  actionsOnHover?: boolean;
  leading?: ReactNode;
  meta?: ReactNode;
  body: ReactNode;
  actions?: ReactNode;
}

export default function UniversalListItem({
  selected = false,
  dragOver = false,
  clickable = false,
  actionsOnHover = true,
  leading,
  meta,
  body,
  actions,
  className,
  ...rest
}: Props) {
  const classes = [
    'universal-list-item',
    selected ? 'selected' : '',
    dragOver ? 'drag-over' : '',
    clickable ? 'clickable' : '',
    actions && actionsOnHover ? 'actions-on-hover' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {leading && <div className="universal-list-item-leading">{leading}</div>}

      <div className="universal-list-item-main">
        {meta && <div className="universal-list-item-meta">{meta}</div>}
        {body}
      </div>

      {actions && <div className="universal-list-item-actions">{actions}</div>}
    </div>
  );
}
