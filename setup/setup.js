

import http from 'k6/http';
import { check } from 'k6';

export function setupUser(email, password) {
  const payload = JSON.stringify({
    email,
    password,
    nickname: "testuser",
    verifyCode: "123456" // assuming this code is mocked/valid
  });

  const res = http.post('https://your-api.com/api/v2/auth/join', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'user created or exists': (r) => r.status === 201 || r.status === 409,
  });

  return { email, password };
}