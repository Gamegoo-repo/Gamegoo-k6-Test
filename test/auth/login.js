import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 1,           // 동시 사용자 수
  duration: '1m',    // 테스트 지속 시간
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% 요청이 500ms 이하
    'http_req_failed': ['rate<0.01'],     // 에러율 1% 미만
  },
};

export default function () {
  const url = 'http://172.31.8.166:8080/api/v2/auth/login';

  const payload = JSON.stringify({
    email: 'test0@naver.com',
    password: '12345678'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*'
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response contains accessToken': (r) => r.json('data.accessToken') !== undefined,
    'response contains refreshToken': (r) => r.json('data.refreshToken') !== undefined,
  });

  sleep(1); // 유저 간 행동 대기 시간 (시뮬레이션용)
}
