import http from 'k6/http';
import { check } from 'k6';
import { getToken } from '../utils/auth.js';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const JWT_REQUIRED = __ENV.JWT_REQUIRED === 'true';
const PAYLOAD_FILE = __ENV.PAYLOAD_FILE;

const userPayloadList = JSON.parse(open(`../data/payloads/${PAYLOAD_FILE}`));

export function setup() {
  const vus = parseInt(__ENV.VUS) || 1;

  const vuData = userPayloadList.map(({ email, password, payloads }) => {
    let token = null;
    if (JWT_REQUIRED && email && password) {
      try {
        token = getToken(email, password);
      } catch (e) {
        console.error(`❌ 토큰 발급 실패: ${email} - ${e.message}`);
      }
    }
    return { token, payloads };
  });

  return { vuData };
}

export default function (data) {
  const index = exec.vu.idInTest - 1;
  const userData = data.vuData[index % data.vuData.length];
  const { token, payloads } = userData;

  for (let i = 0; i < payloads.length; i++) {
    const { path = {}, query = {}, body = {} } = payloads[i];
    let url = `${BASE_URL}${ENDPOINT}`;

    // path 변환
    Object.entries(path).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`);
      url = url.replace(regex, encodeURIComponent(value));
    });

    // query 문자열 구성
    const queryStr = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryStr) url += `?${queryStr}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    // JWT 토큰 추가
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let res;
    if (METHOD === 'GET' || METHOD === 'DELETE') {
      res = METHOD === 'GET' ? http.get(url, { headers }) : http.del(url, null, { headers });
    } else {
      res = http.request(METHOD, url, JSON.stringify(body), { headers });
    }

    check(res, {
      'status is 200': (r) => r.status === 200,
    });
  }
}