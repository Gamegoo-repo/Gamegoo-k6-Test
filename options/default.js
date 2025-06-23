export const options = {
  vus: __ENV.VUS ? parseInt(__ENV.VUS) : 10,
  duration: __ENV.DURATION || '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 요청은 500ms 내
    http_req_failed: ['rate<0.01'],    // 실패율 1% 미만
  },
};