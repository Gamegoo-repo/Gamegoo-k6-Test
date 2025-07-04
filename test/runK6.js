import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

process.env.K6_TLS_SKIP_VERIFY = "true";

dotenv.config();

const testcasesPath = path.resolve("./data/testcases.json");
if (!fs.existsSync(testcasesPath)) {
  console.error("❌ testcases.json 파일을 찾을 수 없습니다.");
  process.exit(1);
}

const testcases = JSON.parse(fs.readFileSync(testcasesPath, "utf-8"));

const BASE_URL = process.env.BASE_URL || "https://dev.gamegoo.co.kr";
const K6_PROMETHEUS_RW_SERVER_URL = process.env.K6_PROMETHEUS_RW_SERVER_URL;
const SUMMARY_API_URL = process.env.SUMMARY_API_URL;

const resultsDir = path.resolve("./results");
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

for (const tc of testcases) {
  const { active, name, endpoint, method = "GET", query = "", jwt = false, payloadFile, rate = 100, duration = "30s", preAllocatedVUs = 5, maxVUs = 10 } = tc;

  if (!active) continue;

  const envVars = {
    BASE_URL,
    RATE: rate.toString(),
    DURATION: duration,
    VUS: preAllocatedVUs.toString(),
    MAX_VUS: maxVUs.toString(),
    TEST_NAME: name,
    ENDPOINT: endpoint,
    METHOD: method,
    QUERY: query,
    JWT_REQUIRED: jwt.toString(),
    PAYLOAD_FILE: payloadFile || "default.json",
    K6_TLS_SKIP_VERIFY: "true",
    K6_PROMETHEUS_RW_SERVER_URL: K6_PROMETHEUS_RW_SERVER_URL || "http://localhost:9090/api/v1/write",
    K6_PROMETHEUS_RW_TREND_AS_NATIVE_HISTOGRAM: "true",
    SUMMARY_API_URL: SUMMARY_API_URL,
  };

  console.log(`\n▶️ ${name} 테스트 실행 중...`);
  console.table(envVars);

  console.log("📦 Spawning k6 with environment variables:", envVars);

  const result = spawnSync("k6", ["run", "--summary-export=results/summary.json", "-o", "experimental-prometheus-rw", "test/mainTest.js"], {
    stdio: "inherit",
    env: { ...process.env, ...envVars },
  });

  if (result.status === 0) {
    console.log(`✅ ${name} 테스트 완료`);
  } else {
    console.error(`❌ ${name} 테스트 실패 (종료 코드: ${result.status})`);
    if (result.error) {
      console.error("❗️ spawnSync error:", result.error);
    }
  }
}
