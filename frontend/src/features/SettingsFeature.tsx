import { useState } from 'react';
import { Form, Select, Button, Input, message, Typography, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { updateProfile, changePassword } from '../api/profile';

export default function SettingsFeature() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

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

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(t('settings.passwordsMismatch'));
      return;
    }
    setPwLoading(true);
    try {
      await changePassword({
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      message.success(t('settings.passwordChanged'));
      pwForm.resetFields();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('settings.passwordChangeFailed');
      message.error(msg);
    } finally {
      setPwLoading(false);
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

      <Divider />

      <Typography.Title level={4}>{t('settings.changePassword')}</Typography.Title>
      <Form form={pwForm} layout="vertical" onFinish={handlePasswordChange}>
        <Form.Item
          name="currentPassword"
          label={t('settings.currentPassword')}
          rules={[{ required: true, message: t('settings.currentPasswordRequired') }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label={t('settings.newPassword')}
          rules={[{ required: true, message: t('settings.newPasswordRequired') }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label={t('settings.confirmPassword')}
          rules={[{ required: true, message: t('settings.confirmPasswordRequired') }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={pwLoading}>
            {t('settings.changePassword')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
