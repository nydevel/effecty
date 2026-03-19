import { useMemo, useState } from 'react';
import { Form, Select, Button, Input, Checkbox, message, Typography, Divider, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { updateProfile, changePassword } from '../api/profile';
import type { UserProfile } from '../api/profile';
import {
  getEncryptionPassphrase,
  setEncryptionPassphrase,
  clearEncryptionPassphrase,
} from '../crypto';

interface Props {
  profile: UserProfile | null;
  onProfileUpdate: () => Promise<void>;
  keyVersion?: number;
}

export default function SettingsFeature({ profile, onProfileUpdate, keyVersion }: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [encLoading, setEncLoading] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [localKeyVersion, setLocalKeyVersion] = useState(0);
  const hasKey = useMemo(() => !!getEncryptionPassphrase(), [keyVersion, localKeyVersion]);
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

  const handleEncryptionChange = async (field: 'encrypt_notes' | 'encrypt_thoughts', value: boolean) => {
    if (!profile) return;
    setEncLoading(true);
    try {
      await updateProfile({
        locale: profile.locale,
        [field]: value,
      });
      await onProfileUpdate();
      message.success(t('settings.saved'));
    } catch (err) {
      console.error('Failed to update encryption settings:', err);
    } finally {
      setEncLoading(false);
    }
  };

  const handleSetKey = () => {
    if (!keyInput.trim()) return;
    setEncryptionPassphrase(keyInput.trim());
    setKeyInput('');
    setLocalKeyVersion((v) => v + 1);
    message.success(t('settings.keyLoaded'));
  };

  const handleClearKey = () => {
    clearEncryptionPassphrase();
    setLocalKeyVersion((v) => v + 1);
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

      <Divider />

      <Typography.Title level={4}>{t('settings.encryption')}</Typography.Title>

      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={profile?.encrypt_notes ?? false}
          disabled={encLoading}
          onChange={(e) => handleEncryptionChange('encrypt_notes', e.target.checked)}
        >
          {t('settings.encryptNotes')}
        </Checkbox>
      </div>
      <div style={{ marginBottom: 16 }}>
        <Checkbox
          checked={profile?.encrypt_thoughts ?? false}
          disabled={encLoading}
          onChange={(e) => handleEncryptionChange('encrypt_thoughts', e.target.checked)}
        >
          {t('settings.encryptThoughts')}
        </Checkbox>
      </div>

      <div style={{ marginBottom: 12 }}>
        {hasKey
          ? <Tag color="green">{t('settings.keyLoaded')}</Tag>
          : <Tag color="red">{t('settings.keyNotLoaded')}</Tag>
        }
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input.Password
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onPressEnter={handleSetKey}
          placeholder={t('settings.encryptionKey')}
          style={{ flex: 1 }}
        />
        <Button type="primary" onClick={handleSetKey}>
          {t('settings.setKey')}
        </Button>
        {hasKey && (
          <Button danger onClick={handleClearKey}>
            {t('settings.clearKey')}
          </Button>
        )}
      </div>

      <Typography.Text type="warning" style={{ fontSize: 12 }}>
        {t('settings.encryptionWarning')}
      </Typography.Text>
    </div>
  );
}
