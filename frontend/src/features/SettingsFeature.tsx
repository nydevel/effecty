import { useEffect, useRef, useState } from 'react';
import AppButton from '../components/ui/AppButton';
import { Form, Select, Slider, Input, InputNumber, message, Typography, Divider, Modal } from 'antd';
import { DownloadOutlined, UploadOutlined } from '../components/ui/icons';
import { useTranslation } from 'react-i18next';
import { updateProfile, changePassword, DEFAULT_UI_SETTINGS } from '../api/profile';
import type { UserProfile } from '../api/profile';
import { exportData, importData } from '../api/data-transfer';
import {
  DEFAULT_WORKOUTS_SETTINGS,
  MUSCLE_GROUPS,
  getWorkoutsSettings,
  updateWorkoutsSettings,
} from '../api/workouts';
import type { MuscleGroup, WorkoutsSettings } from '../api/workouts';

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
  const [workoutsSettings, setWorkoutsSettings] = useState<WorkoutsSettings>(DEFAULT_WORKOUTS_SETTINGS);
  const [workoutsSettingsLoading, setWorkoutsSettingsLoading] = useState(false);
  const [workoutsSettingsSaving, setWorkoutsSettingsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm();
  const [pwForm] = Form.useForm();

  const uiSettings = profile?.ui_settings ?? DEFAULT_UI_SETTINGS;

  useEffect(() => {
    setWorkoutsSettingsLoading(true);
    getWorkoutsSettings()
      .then((settings) => {
        setWorkoutsSettings(settings);
      })
      .catch((err) => {
        console.error('Failed to load workouts settings:', err);
      })
      .finally(() => {
        setWorkoutsSettingsLoading(false);
      });
  }, []);

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

  const handleRecoveryHoursChange = (group: MuscleGroup, value: number | null) => {
    if (value == null) return;
    setWorkoutsSettings((prev) => ({
      recovery_hours: {
        ...prev.recovery_hours,
        [group]: value,
      },
    }));
  };

  const handleSaveWorkoutsSettings = async () => {
    setWorkoutsSettingsSaving(true);
    try {
      const saved = await updateWorkoutsSettings(workoutsSettings);
      setWorkoutsSettings(saved);
      message.success(t('settings.saved'));
    } catch (err) {
      console.error('Failed to save workouts settings:', err);
    } finally {
      setWorkoutsSettingsSaving(false);
    }
  };

  const handleResetWorkoutsSettings = () => {
    setWorkoutsSettings(DEFAULT_WORKOUTS_SETTINGS);
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

      <Typography.Title level={4}>{t('settings.workoutsRecoveryTitle')}</Typography.Title>
      <Typography.Text className="settings-section-note">
        {t('settings.workoutsRecoveryDescription', {
          hours: DEFAULT_WORKOUTS_SETTINGS.recovery_hours.chest,
        })}
      </Typography.Text>
      <div className="settings-recovery-grid">
        {MUSCLE_GROUPS.map((group) => (
          <div key={group} className="settings-recovery-row">
            <div className="settings-recovery-label">{t(`workouts.${group}`)}</div>
            <InputNumber
              min={1}
              max={240}
              step={1}
              value={workoutsSettings.recovery_hours[group]}
              disabled={workoutsSettingsLoading}
              addonAfter={t('settings.hoursShort')}
              onChange={(value) => handleRecoveryHoursChange(group, value)}
            />
          </div>
        ))}
      </div>
      <div className="settings-actions-row">
        <AppButton
          type="primary"
          onClick={handleSaveWorkoutsSettings}
          loading={workoutsSettingsSaving}
          disabled={workoutsSettingsLoading}
        >
          {t('settings.save')}
        </AppButton>
        <AppButton
          onClick={handleResetWorkoutsSettings}
          disabled={workoutsSettingsLoading || workoutsSettingsSaving}
        >
          {t('settings.resetDefaults')}
        </AppButton>
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
