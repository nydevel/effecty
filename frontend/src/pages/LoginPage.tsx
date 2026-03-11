import { useState } from 'react';
import { Button, Form, Input, Alert, Typography } from 'antd';
import { login } from '../api/auth';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { email: string; password: string }) => {
    setError('');
    setLoading(true);
    try {
      await login(values.email.trim(), values.password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <Typography.Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          effecty
        </Typography.Title>
        {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form layout="vertical" onFinish={handleFinish} autoComplete="off">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="Email" size="large" autoFocus />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Password" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block size="large">
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
