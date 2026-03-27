import { useState, useRef } from 'react';
import AppButton from '../components/ui/AppButton';
import { Form, Select, Slider, Input, message, Typography, Divider, Modal } from 'antd';
import { DownloadOutlined, UploadOutlined } from '../components/ui/icons';
import { useTranslation } from 'react-i18next';
import { updateProfile, changePassword, DEFAULT_UI_SETTINGS } from '../api/profile';
import type { UserProfile } from '../api/profile';
import { exportData, importData } from '../api/data-transfer';

interface Props {
  profile: UserProfile | null;
  onProfileUpdate: () => Promise<void>;
}

export default function SettingsFeature({ profile, onProfileUpdate }: Props) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

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
    <div className="settings-page settings-page-padded">
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
          <AppButton type="primary" htmlType="submit" loading={loading}>
            {t('settings.save')}
          </AppButton>
        </Form.Item>
      </Form>

      <Divider />

      <Typography.Title level={4}>{t('settings.fontScale')}</Typography.Title>
      <div className="settings-slider-row">
        <Slider
          min={0.8}
          max={1.5}
          step={0.1}
          value={uiSettings.font_scale}
          onChange={handleFontScaleChange}
          className="settings-slider-control"
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
          <AppButton type="primary" htmlType="submit" loading={pwLoading}>
            {t('settings.changePassword')}
          </AppButton>
        </Form.Item>
      </Form>

      <Divider />

      <Typography.Title level={4}>{t('settings.dataTransfer')}</Typography.Title>
      <Typography.Text className="settings-section-note">
        {t('settings.exportDescription')}
      </Typography.Text>
      <AppButton
        icon={<DownloadOutlined />}
        onClick={handleExport}
        loading={exportLoading}
        className="settings-export-btn"
      >
        {t('settings.exportData')}
      </AppButton>

      <Typography.Text className="settings-section-note">
        {t('settings.importDescription')}
      </Typography.Text>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="settings-hidden-input"
        onChange={handleFileSelected}
      />
      <AppButton
        icon={<UploadOutlined />}
        danger
        onClick={handleImportClick}
        loading={importLoading}
      >
        {t('settings.importData')}
      </AppButton>
      </div>
    </div>
  );
}
