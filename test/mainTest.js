import http from "k6/http";
import { check } from "k6";
import { getToken } from "../utils/auth.js";
import exec from "k6/execution";

const BASE_URL = __ENV.BASE_URL;
const ENDPOINT = __ENV.ENDPOINT;
const METHOD = (__ENV.METHOD || "POST").toUpperCase();
const JWT_REQUIRED = __ENV.JWT_REQUIRED === "true";
const PAYLOAD_FILE = __ENV.PAYLOAD_FILE;
const TEST_NAME = __ENV.TEST_NAME || "unnamed";
const SUMMARY_API_URL = __ENV.SUMMARY_API_URL;
const MAX_VUS = __ENV.MAX_VUS;
const DURATION = __ENV.DURATION;
const RATE = __ENV.RATE;

const userPayloadList = JSON.parse(open(`../data/payloads/${PAYLOAD_FILE}`));

export const options = {
  scenarios: {
    steady_rps: {
      executor: "constant-arrival-rate",
      rate: parseInt(__ENV.RATE) || 100,
      timeUnit: "1s",
      duration: __ENV.DURATION || "10s",
      preAllocatedVUs: parseInt(__ENV.VUS) || 5,
      maxVUs: parseInt(__ENV.MAX_VUS) || 5,
    },
  },
};

export function setup() {
  // JWT 발급
  return userPayloadList.map((account) => {
    let token = null;
    if (JWT_REQUIRED && account.email && account.password) {
      try {
        token = getToken(account.email, account.password);
      } catch (e) {
        console.error(`❌ 토큰 발급 실패: ${account.email}`);
      }
    }

    return {
      token,
      payloads: account.payloads,
      email: account.email,
    };
  });
}

export default function (accounts) {
  const vuId = exec.vu.idInTest - 1;
  const iter = exec.vu.iterationInScenario;
  const account = accounts[vuId % accounts.length];
  const token = account.token;
  const payloads = account.payloads; // 해당 vUser의 모든 payload 리스트

  // 요청 생성
  let url = `${BASE_URL}${ENDPOINT}`;

  if (payloads.length > 0) {
    const payload = payloads[iter % payloads.length]; // 현재 default()실행에서 보낼 단 하나의 payload

    const { path = {}, query = {}, body = {} } = payload;

    // path 변환
    Object.entries(path).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`);
      url = url.replace(regex, encodeURIComponent(value));
    });

    // query 문자열 구성
    const queryStr = Object.entries(query)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    if (queryStr) url += `?${queryStr}`;
  }

  const headers = {
    "Content-Type": "application/json",
  };

  // JWT 토큰 추가
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  if (METHOD === "GET" || METHOD === "DELETE") {
    res = METHOD === "GET" ? http.get(url, { headers }) : http.del(url, null, { headers });
  } else {
    res = http.request(METHOD, url, JSON.stringify(body), { headers });
  }

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  // 실패 응답 로깅
  if (res.status >= 400) {
    console.error(`❌ ${res.status} ${METHOD} ${url}`);
    console.error(`User: ${account.email}`);
  }
}

export function handleSummary(data) {
  const payload = {
    apiName: TEST_NAME,
    apiEndpoint: ENDPOINT,
    iterationTag: `${MAX_VUS}mxVus_${RATE}rps_${DURATION}du`,
    metrics: data.metrics,
  };

  try {
    const res = http.post(SUMMARY_API_URL, JSON.stringify(payload), {
      headers: { "Content-Type": "application/json" },
    });
    console.log(`📤 Summary sent to server: status ${res.status}`);
  } catch (e) {
    console.error("❌ Failed to POST summary:", e);
  }

  return;
}
