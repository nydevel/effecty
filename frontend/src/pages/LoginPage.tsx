import { useState } from 'react';
import { Button, Form, Input, Alert, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { login } from '../api/auth';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.email.trim(), values.password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('login.title')}
        </Typography.Title>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={handleFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('login.emailRequired') },
              { type: 'email', message: t('login.emailInvalid') },
            ]}
          >
            <Input placeholder={t('login.email')} size="large" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: t('login.passwordRequired') }]}
          >
            <Input.Password placeholder={t('login.password')} size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              {t('login.signIn')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
