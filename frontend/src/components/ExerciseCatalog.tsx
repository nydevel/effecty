import { useState } from 'react';
import { Button, Input, Select, Typography, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Exercise, MuscleGroup } from '../api/workouts';
import { MUSCLE_GROUPS } from '../api/workouts';

interface Props {
  exercises: Exercise[];
  onCreateExercise: (name: string, muscleGroup?: string) => void;
  onUpdateExercise: (id: string, data: { name?: string; muscle_group?: string }) => void;
  onDeleteExercise: (id: string) => void;
}

export default function ExerciseCatalog({
  exercises,
  onCreateExercise,
  onUpdateExercise,
  onDeleteExercise,
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
        <Input
          size="small"
          placeholder={t('workouts.newExercise')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAdd}
          style={{ marginTop: 8 }}
          suffix={
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              style={{ marginRight: -7 }}
            />
          }
        />
        <Select
          size="small"
          placeholder={t('workouts.muscleGroup')}
          value={newGroup}
          onChange={setNewGroup}
          allowClear
          style={{ width: '100%', marginTop: 4 }}
          options={muscleGroupOptions}
        />
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
                  onBlur={saveEdit}
                  autoFocus
                />
                <Select
                  size="small"
                  value={editGroup}
                  onChange={setEditGroup}
                  allowClear
                  placeholder={t('workouts.muscleGroup')}
                  style={{ width: '100%' }}
                  options={muscleGroupOptions}
                />
              </div>
            ) : (
              <div
                className="exercise-catalog-item"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/exercise-name', ex.name);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <span className="exercise-catalog-item-name">{ex.name}</span>
                {ex.muscle_group && (
                  <span className="exercise-catalog-item-group">
                    {t(`workouts.${ex.muscle_group}`)}
                  </span>
                )}
              </div>
            )}
          </Dropdown>
        ))}
      </div>
    </div>
  );
}
