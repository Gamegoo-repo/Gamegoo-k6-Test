import http from 'k6/http';
import { check } from 'k6';
import { getToken } from '../utils/auth.js';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const JWT_REQUIRED = __ENV.JWT_REQUIRED === 'true';
const PAYLOAD_FILE = __ENV.PAYLOAD_FILE || 'default.json';

const payloadList = JSON.parse(open(`../data/payloads/${PAYLOAD_FILE}`));

export default function () {
  const index = exec.vu.idInTest - 1;
  const payloadObj = payloadList[index % payloadList.length];

  let token = null;
  if (JWT_REQUIRED && payloadObj?.email && payloadObj?.password) {
    try {
      token = getToken(payloadObj.email, payloadObj.password);
    } catch (e) {
      console.error(`❌ 토큰 발급 실패: ${payloadObj.email} - ${e.message}`);
    }
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  if (METHOD === 'GET') {
    res = http.get(`${BASE_URL}${ENDPOINT}`, { headers });
  } else {
    res = http.request(METHOD, `${BASE_URL}${ENDPOINT}`, JSON.stringify(payloadObj), { headers });
  }

  check(res, {
    'status is 200': (r) => r.status === 200
  });
}