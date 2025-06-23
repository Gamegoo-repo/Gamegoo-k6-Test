import http from 'k6/http';
import { check } from 'k6';
import { getToken } from '../utils/auth.js';

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const METHOD = (__ENV.METHOD || 'POST').toUpperCase();
const JWT_REQUIRED = __ENV.JWT_REQUIRED === 'true';
const PAYLOAD_FILE = __ENV.PAYLOAD_FILE || 'default.json';

const payloadList = JSON.parse(open(`../data/payloads/${PAYLOAD_FILE}`));

export default function () {
  const index = __VU - 1;
  const payloadObj = payloadList[index];

  let token = null;
  if (JWT_REQUIRED && payloadObj?.email && payloadObj?.password) {
    token = getToken(payloadObj.email, payloadObj.password);
  }

  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = http.request(METHOD, `${BASE_URL}${ENDPOINT}`, JSON.stringify(payloadObj), { headers });

  check(res, {
    'status is 200': (r) => r.status === 200
  });
}