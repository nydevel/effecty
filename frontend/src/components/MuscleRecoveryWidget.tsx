import Body from '@mjcdev/react-body-highlighter';
import { useTranslation } from 'react-i18next';
import type { ExtendedBodyPart, Slug } from '@mjcdev/react-body-highlighter';
import type { MuscleGroup } from '../api/workouts';

export type MuscleRecoveryStatus = 'ready' | 'recovering';

export interface MuscleRecoveryState {
  group: MuscleGroup;
  status: MuscleRecoveryStatus;
  recoveryHours: number;
  hoursLeft: number;
  progress: number;
  lastWorkoutAt: Date | null;
  readyAt: Date | null;
}

interface Props {
  items: MuscleRecoveryState[];
}

const BODY_COLORS = ['#f0a43b', '#4caf7a', '#dfe8e3'] as const;
const BODY_BORDER = '#cfd9d3';
const BODY_SCALE = 0.62;

const FRONT_SLUGS: ReadonlyArray<Slug> = [
  'chest',
  'obliques',
  'abs',
  'biceps',
  'triceps',
  'neck',
  'trapezius',
  'deltoids',
  'adductors',
  'quadriceps',
  'knees',
  'tibialis',
  'calves',
  'forearm',
  'hands',
  'ankles',
  'feet',
  'head',
  'hair',
];

const BACK_SLUGS: ReadonlyArray<Slug> = [
  'neck',
  'trapezius',
  'deltoids',
  'upper-back',
  'triceps',
  'lower-back',
  'forearm',
  'gluteal',
  'adductors',
  'hamstring',
  'calves',
  'ankles',
  'feet',
  'hands',
  'head',
  'hair',
];

const GROUP_TO_SLUGS: Record<MuscleGroup, { front: ReadonlyArray<Slug>; back: ReadonlyArray<Slug> }> = {
  chest: {
    front: ['chest'],
    back: [],
  },
  shoulders: {
    front: ['deltoids'],
    back: ['deltoids'],
  },
  arms: {
    front: ['biceps', 'triceps', 'forearm'],
    back: ['triceps', 'forearm'],
  },
  legs: {
    front: ['quadriceps', 'adductors', 'tibialis', 'calves'],
    back: ['gluteal', 'hamstring', 'adductors', 'calves'],
  },
  back: {
    front: ['trapezius'],
    back: ['trapezius', 'upper-back', 'lower-back'],
  },
};

function getStatusColor(item: MuscleRecoveryState): string {
  return item.status === 'ready' ? '#4caf7a' : '#f0a43b';
}

function getBodyIntensity(item: MuscleRecoveryState): number {
  if (!item.lastWorkoutAt) {
    return 3;
  }

  return item.status === 'recovering' ? 1 : 2;
}

function buildBodyData(
  items: ReadonlyArray<MuscleRecoveryState>,
  side: 'front' | 'back',
): ExtendedBodyPart[] {
  const slugs = side === 'front' ? FRONT_SLUGS : BACK_SLUGS;
  const intensityBySlug = new Map<Slug, number>(slugs.map((slug) => [slug, 3]));

  for (const item of items) {
    const targetSlugs = GROUP_TO_SLUGS[item.group][side];
    const intensity = getBodyIntensity(item);

    for (const slug of targetSlugs) {
      intensityBySlug.set(slug, intensity);
    }
  }

  return slugs.map((slug) => {
    const intensity = intensityBySlug.get(slug) ?? 3;
    return {
      slug,
      intensity,
      leftSideIntensity: intensity,
      rightSideIntensity: intensity,
    };
  });
}

function formatDateTime(date: Date, locale: string): string {
  const formatter = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  return formatter.format(date);
}

export default function MuscleRecoveryWidget({ items }: Props) {
  const { t, i18n } = useTranslation();
  const frontBodyData = buildBodyData(items, 'front');
  const backBodyData = buildBodyData(items, 'back');

  return (
    <div className="muscle-recovery-widget">
      <div className="muscle-recovery-visual-card">
        <div className="muscle-recovery-body-map-grid" role="img" aria-label={t('dashboard.muscleRecovery')}>
          <div className="muscle-recovery-figure-card">
            <div className="muscle-recovery-view-label">{t('dashboard.frontView')}</div>
            <div className="muscle-recovery-figure">
              <Body
                data={frontBodyData}
                gender="male"
                side="front"
                scale={BODY_SCALE}
                border={BODY_BORDER}
                colors={BODY_COLORS}
              />
            </div>
          </div>

          <div className="muscle-recovery-figure-card">
            <div className="muscle-recovery-view-label">{t('dashboard.backView')}</div>
            <div className="muscle-recovery-figure">
              <Body
                data={backBodyData}
                gender="male"
                side="back"
                scale={BODY_SCALE}
                border={BODY_BORDER}
                colors={BODY_COLORS}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="muscle-recovery-list">
        {items.map((item) => (
          <div key={item.group} className={`muscle-recovery-row muscle-recovery-row-${item.status}`}>
            <div className="muscle-recovery-row-top">
              <div className="muscle-recovery-row-title">
                <span
                  className="muscle-recovery-swatch"
                  style={{ backgroundColor: getStatusColor(item) }}
                />
                <span>{t(`workouts.${item.group}`)}</span>
              </div>
              <span className={`muscle-recovery-chip muscle-recovery-chip-${item.status}`}>
                {item.status === 'ready' ? t('dashboard.recoveryReady') : t('dashboard.recoveryRecovering')}
              </span>
            </div>

            <div className="muscle-recovery-row-meta">
              {item.status === 'ready'
                ? t('dashboard.readyNow')
                : t('dashboard.hoursToRecovery', { count: item.hoursLeft })}
            </div>

            <div className="muscle-recovery-row-subtle">
              {item.readyAt
                ? t('dashboard.readyAt', {
                    time: formatDateTime(item.readyAt, i18n.language),
                  })
                : t('dashboard.noWorkoutData')}
            </div>

            <div className="muscle-recovery-progress">
              <span style={{ width: `${Math.max(8, Math.round(item.progress * 100))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
