import http from 'k6/http';
import { check } from 'k6';

export function login(email, password) {
  const payload = JSON.stringify({ email, password });

  const res = http.post('https://your-api.com/api/v2/auth/login', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'login success': (r) => r.status === 200,
  });

  const responseBody = JSON.parse(res.body);
  return {
    accessToken: responseBody.accessToken,
    refreshToken: responseBody.refreshToken,
  };
}
