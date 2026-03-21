import { useMemo, useRef, useState } from 'react';
import { Form, Select, Slider, Button, Input, Checkbox, message, Typography, Divider, Tag, Modal } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { updateProfile, changePassword, DEFAULT_ENCRYPTION_SETTINGS, DEFAULT_UI_SETTINGS } from '../api/profile';
import type { UserProfile, EncryptionSettings } from '../api/profile';
import { exportData, importData } from '../api/data-transfer';
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
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [keyInput, setKeyInput] = useState('');
  const [localKeyVersion, setLocalKeyVersion] = useState(0);
  const hasKey = useMemo(() => !!getEncryptionPassphrase(), [keyVersion, localKeyVersion]);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  const encSettings = profile?.encryption_settings ?? DEFAULT_ENCRYPTION_SETTINGS;
  const uiSettings = profile?.ui_settings ?? DEFAULT_UI_SETTINGS;

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

  const handleFontScaleChange = async (value: number) => {
    if (!profile) return;
    document.documentElement.style.setProperty('--font-scale', String(value));
    try {
      await updateProfile({
        locale: profile.locale,
        ui_settings: { font_scale: value },
      });
      await onProfileUpdate();
    } catch (err) {
      console.error('Failed to save font scale:', err);
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

  const handleEncryptionToggle = async (
    section: keyof EncryptionSettings,
    field: string,
    value: boolean,
  ) => {
    if (!profile) return;
    setEncLoading(true);
    try {
      const updated: EncryptionSettings = {
        ...encSettings,
        [section]: {
          ...encSettings[section],
          [field]: value,
        },
      };
      await updateProfile({
        locale: profile.locale,
        encryption_settings: updated,
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await exportData();
    } catch (err) {
      console.error('Export failed:', err);
      message.error(t('settings.exportFailed'));
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be re-selected
    e.target.value = '';

    Modal.confirm({
      title: t('settings.importData'),
      content: t('settings.importConfirm'),
      okType: 'danger',
      onOk: async () => {
        setImportLoading(true);
        try {
          await importData(file);
          message.success(t('settings.importSuccess'));
        } catch (err) {
          const msg = err instanceof Error ? err.message : t('settings.importFailed');
          message.error(msg);
        } finally {
          setImportLoading(false);
        }
      },
    });
  };

  return (
    <div className="settings-page" style={{ padding: 32, maxHeight: '100%' }}>
      <div className="settings-page-inner">
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

      <Typography.Title level={4}>{t('settings.fontScale')}</Typography.Title>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <Slider
          min={0.8}
          max={1.5}
          step={0.1}
          value={uiSettings.font_scale}
          onChange={handleFontScaleChange}
          style={{ flex: 1 }}
          marks={{ 0.8: '×0.8', 1.0: '×1.0', 1.2: '×1.2', 1.5: '×1.5' }}
        />
      </div>

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

      <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
        {t('settings.encNotes')}
      </Typography.Text>
      <div style={{ marginBottom: 8, paddingLeft: 16 }}>
        <Checkbox
          checked={encSettings.notes.title}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('notes', 'title', e.target.checked)}
        >
          {t('settings.encTitle')}
        </Checkbox>
        <br />
        <Checkbox
          checked={encSettings.notes.content}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('notes', 'content', e.target.checked)}
        >
          {t('settings.encContent')}
        </Checkbox>
      </div>

      <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
        {t('settings.encMemos')}
      </Typography.Text>
      <div style={{ marginBottom: 8, paddingLeft: 16 }}>
        <Checkbox
          checked={encSettings.memos.title}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('memos', 'title', e.target.checked)}
        >
          {t('settings.encTitle')}
        </Checkbox>
        <br />
        <Checkbox
          checked={encSettings.memos.content}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('memos', 'content', e.target.checked)}
        >
          {t('settings.encContent')}
        </Checkbox>
      </div>

      <Typography.Text strong style={{ display: 'block', marginBottom: 4 }}>
        {t('settings.encThoughts')}
      </Typography.Text>
      <div style={{ marginBottom: 8, paddingLeft: 16 }}>
        <Checkbox
          checked={encSettings.thoughts.title}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('thoughts', 'title', e.target.checked)}
        >
          {t('settings.encTitle')}
        </Checkbox>
        <br />
        <Checkbox
          checked={encSettings.thoughts.content}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('thoughts', 'content', e.target.checked)}
        >
          {t('settings.encContent')}
        </Checkbox>
        <br />
        <Checkbox
          checked={encSettings.thought_comments.content}
          disabled={encLoading}
          onChange={(e) => handleEncryptionToggle('thought_comments', 'content', e.target.checked)}
        >
          {t('settings.encComments')}
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

      <Divider />

      <Typography.Title level={4}>{t('settings.dataTransfer')}</Typography.Title>
      <Typography.Text style={{ display: 'block', marginBottom: 12 }}>
        {t('settings.exportDescription')}
      </Typography.Text>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleExport}
        loading={exportLoading}
        style={{ marginBottom: 16 }}
      >
        {t('settings.exportData')}
      </Button>

      <Typography.Text style={{ display: 'block', marginBottom: 12 }}>
        {t('settings.importDescription')}
      </Typography.Text>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFileSelected}
      />
      <Button
        icon={<UploadOutlined />}
        danger
        onClick={handleImportClick}
        loading={importLoading}
      >
        {t('settings.importData')}
      </Button>
      </div>
    </div>
  );
}
