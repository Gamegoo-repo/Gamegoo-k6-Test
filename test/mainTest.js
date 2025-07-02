import http from 'k6/http';
import { check } from 'k6';
import { getToken } from '../utils/auth.js';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const JWT_REQUIRED = __ENV.JWT_REQUIRED === 'true';
const PAYLOAD_FILE = __ENV.PAYLOAD_FILE || 'deault.json';

const payloadList = JSON.parse(open(`../data/payloads/${PAYLOAD_FILE}`));
const jwtList = JSON.parse(open(`../data/payloads/jwt.json`));

export function setup() {
  let tokens = [];
  if (JWT_REQUIRED) {
    tokens = jwtList.map(({ email, password }) => {
      try {
        return getToken(email, password);
      } catch (e) {
        console.error(`❌ 토큰 발급 실패: ${email} - ${e.message}`);
        return null;
      }
    });
  }

  const vus = parseInt(__ENV.VUS) || 1;
  const chunkSize = Math.ceil(payloadList.length / vus);
  const payloadChunks = Array.from({ length: vus }, (_, i) => {
    return payloadList.slice(i * chunkSize, (i + 1) * chunkSize);
  });

  return { tokens, payloadChunks };
}

export default function (data) {
  const index = exec.vu.idInTest - 1;
  const token = data.tokens.length ? data.tokens[index % data.tokens.length] : null;
  const myPayloads = data.payloadChunks[index];

  for (let i = 0; i < myPayloads.length; i++) {
    const { path = {}, query = {}, body = {} } = myPayloads[i];
    let url = `${BASE_URL}${ENDPOINT}`;

    // path 있으면 추가
    Object.entries(path).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`);
      url = url.replace(regex, encodeURIComponent(value));
    });

    // query 있으면 추가
    const queryStr = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (queryStr) url += `?${queryStr}`;

    const headers = {
      'Content-Type': 'application/json',
    };

    // Jwt 토큰
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