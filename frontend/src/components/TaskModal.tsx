import { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, TimePicker, Button, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Task } from '../api/tasks';

interface Props {
  task: Task | null;
  defaultDate: string;
  onSave: (data: {
    title: string;
    content: string;
    priority: number;
    task_date: string;
    time_start: string | null;
    time_end: string | null;
  }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export default function TaskModal({ task, defaultDate, onSave, onDelete, onClose }: Props) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title: task?.title ?? '',
      content: task?.content ?? '',
      priority: task?.priority ?? 0,
      task_date: dayjs(task?.task_date ?? defaultDate, 'YYYY-MM-DD'),
      time_start: task?.time_start ? dayjs(task.time_start, 'HH:mm:ss') : null,
      time_end: task?.time_end ? dayjs(task.time_end, 'HH:mm:ss') : null,
    });
  }, [task, defaultDate, form]);

  const handleFinish = (values: {
    title: string;
    content: string;
    priority: number;
    task_date: dayjs.Dayjs;
    time_start: dayjs.Dayjs | null;
    time_end: dayjs.Dayjs | null;
  }) => {
    onSave({
      title: values.title,
      content: values.content || '',
      priority: values.priority,
      task_date: values.task_date.format('YYYY-MM-DD'),
      time_start: values.time_start ? values.time_start.format('HH:mm:ss') : null,
      time_end: values.time_end ? values.time_end.format('HH:mm:ss') : null,
    });
  };

  return (
    <Modal
      open
      title={task ? t('tasks.editTask') : t('tasks.newTask')}
      onCancel={onClose}
      footer={
        <Space>
          {task && onDelete && (
            <Button danger onClick={onDelete}>
              {t('tasks.delete')}
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button onClick={onClose}>{t('tasks.cancel')}</Button>
          <Button type="primary" onClick={() => form.submit()}>
            {t('tasks.save')}
          </Button>
        </Space>
      }
      width={440}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="title" label={t('tasks.title')} rules={[{ required: true, message: t('tasks.titleRequired') }]}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item name="content" label={t('tasks.notes')}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="priority" label={t('tasks.priority')} style={{ flex: 1 }}>
            <Select
              options={[
                { value: 0, label: t('tasks.priorityNone') },
                { value: 1, label: t('tasks.priorityLow') },
                { value: 2, label: t('tasks.priorityMedium') },
                { value: 3, label: t('tasks.priorityHigh') },
              ]}
            />
          </Form.Item>
          <Form.Item name="task_date" label={t('tasks.date')} rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Space>
        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="time_start" label={t('tasks.start')} style={{ flex: 1 }}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="time_end" label={t('tasks.end')} style={{ flex: 1 }}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}
