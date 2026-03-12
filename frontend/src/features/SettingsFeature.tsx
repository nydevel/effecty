import { useState } from 'react';
import { Form, Select, Button, message, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { updateProfile } from '../api/profile';

export default function SettingsFeature() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleFinish = async (values: { locale: string }) => {
    setLoading(true);
    try {
      await updateProfile({ locale: values.locale });
      await i18n.changeLanguage(values.locale);
      message.success(t('settings.saved'));
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, padding: 32 }}>
      <Typography.Title level={3}>{t('settings.title')}</Typography.Title>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ locale: i18n.language }}
        onFinish={handleFinish}
      >
        <Form.Item name="locale" label={t('settings.language')}>
          <Select>
            <Select.Option value="en">{t('settings.english')}</Select.Option>
            <Select.Option value="ru">{t('settings.russian')}</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t('settings.save')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
