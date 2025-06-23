import http from 'k6/http';

export function getToken(email, password) {
  const url = `${__ENV.BASE_URL}/api/v2/auth/login`;
  const payload = JSON.stringify({
    email,
    password
  });

  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);

  if (res.status === 200) {
    return JSON.parse(res.body).accessToken;
  }

  throw new Error(`로그인 실패: ${res.status} ${res.body}`);
}