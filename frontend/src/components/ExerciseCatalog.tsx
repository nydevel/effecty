import { useState } from 'react';
import AppButton from './ui/AppButton';
import { Dropdown, Input, Select, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from './ui/icons';
import { useTranslation } from 'react-i18next';
import type { Exercise, MuscleGroup } from '../api/workouts';
import { MUSCLE_GROUPS } from '../api/workouts';

interface Props {
  exercises: Exercise[];
  onCreateExercise: (name: string, muscleGroup?: string) => void;
  onUpdateExercise: (id: string, data: { name?: string; muscle_group?: string }) => void;
  onDeleteExercise: (id: string) => void;
  canAddToWorkout: boolean;
  onAddToWorkout: (exerciseName: string) => void;
}

export default function ExerciseCatalog({
  exercises,
  onCreateExercise,
  onUpdateExercise,
  onDeleteExercise,
  canAddToWorkout,
  onAddToWorkout,
}: Props) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<MuscleGroup | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState<MuscleGroup | undefined>(undefined);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    onCreateExercise(name, newGroup);
    setNewName('');
    setNewGroup(undefined);
  };

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditName(ex.name);
    setEditGroup(ex.muscle_group ?? undefined);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const ex = exercises.find((e) => e.id === editingId);
    if (!ex) return;
    const data: { name?: string; muscle_group?: string } = {};
    if (editName.trim() && editName.trim() !== ex.name) data.name = editName.trim();
    if (editGroup !== (ex.muscle_group ?? undefined)) data.muscle_group = editGroup ?? '';
    if (Object.keys(data).length > 0) {
      onUpdateExercise(editingId, data);
    }
    setEditingId(null);
  };

  const muscleGroupOptions = MUSCLE_GROUPS.map((g) => ({
    value: g,
    label: t(`workouts.${g}`),
  }));

  return (
    <div className="exercise-catalog">
      <div className="exercise-catalog-header">
        <Typography.Text strong>{t('workouts.exercises')}</Typography.Text>
        <div className="exercise-catalog-create-form">
          <Input
            className="exercise-catalog-new-input"
            size="small"
            placeholder={t('workouts.newExercise')}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onPressEnter={handleAdd}
          />
          <Select
            className="exercise-catalog-group-select"
            size="small"
            placeholder={t('workouts.muscleGroup')}
            value={newGroup}
            onChange={setNewGroup}
            allowClear
            options={muscleGroupOptions}
          />
          <AppButton
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="exercise-catalog-create-btn"
            block
          >
            {t('workouts.newExercise')}
          </AppButton>
        </div>
      </div>
      <div className="exercise-catalog-list">
        {exercises.map((ex) => (
          <Dropdown
            key={ex.id}
            menu={{
              items: [
                {
                  key: 'edit',
                  label: t('workouts.editExercise'),
                  icon: <EditOutlined />,
                  onClick: () => startEdit(ex),
                },
                {
                  key: 'delete',
                  label: t('workouts.deleteExercise'),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => onDeleteExercise(ex.id),
                },
              ],
            }}
            trigger={['contextMenu']}
          >
            {editingId === ex.id ? (
              <div className="exercise-catalog-item editing">
                <Input
                  size="small"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onPressEnter={saveEdit}
                  autoFocus
                />
                <Select
                  className="exercise-catalog-edit-group"
                  size="small"
                  value={editGroup}
                  onChange={setEditGroup}
                  allowClear
                  placeholder={t('workouts.muscleGroup')}
                  options={muscleGroupOptions}
                />
                <div className="exercise-catalog-edit-actions">
                  <AppButton size="small" type="primary" icon={<CheckOutlined />} onClick={saveEdit} />
                  <AppButton size="small" icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
                </div>
              </div>
            ) : (
              <div className="exercise-catalog-item">
                <span className="exercise-catalog-item-name">{ex.name}</span>
                {ex.muscle_group && (
                  <span className="exercise-catalog-item-group">
                    {t(`workouts.${ex.muscle_group}`)}
                  </span>
                )}
                <AppButton
                  type="text"
                  size="small"
                  icon={<PlusOutlined />}
                  className="exercise-catalog-add-btn"
                  disabled={!canAddToWorkout}
                  title={
                    canAddToWorkout
                      ? t('workouts.addExerciseToWorkout')
                      : t('workouts.selectWorkoutFirst')
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onAddToWorkout(ex.name);
                  }}
                />
              </div>
            )}
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
