import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

process.env.K6_TLS_SKIP_VERIFY = 'true';

dotenv.config();

const testcasesPath = path.resolve('./data/testcases.json');
if (!fs.existsSync(testcasesPath)) {
  console.error('❌ testcases.json 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const testcases = JSON.parse(fs.readFileSync(testcasesPath, 'utf-8'));

const BASE_URL = process.env.BASE_URL || 'https://api.example.com';
const VUS = process.env.VUS || '10';
const DURATION = process.env.DURATION || '30s';

const resultsDir = path.resolve('./results');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir);
}

for (const tc of testcases) {
  const {
    name,
    endpoint,
    method = 'GET',
    query = '',
    jwt = false,
    payloadFolder = '',
    payloadFile = '',
  } = tc;

  const envVars = {
    BASE_URL,
    VUS,
    DURATION,
    TEST_NAME: name,
    ENDPOINT: endpoint,
    METHOD: method,
    QUERY: query,
    JWT_REQUIRED: jwt.toString(),
    PAYLOAD_FILE: 'login.json', //TODO: 테스트마다 여기 수정하기
    K6_TLS_SKIP_VERIFY: 'true', 
  };

  console.log(`\n▶️ ${name} 테스트 실행 중...`);
  console.table(envVars);

  if (!payloadFile) {
    console.warn('⚠️ PAYLOAD_FILE is not defined. Please check testcases.json and ensure "payloadFile" is correctly set.');
  }

  console.log('📦 Spawning k6 with environment variables:', envVars);

  const result = spawnSync('k6', [
    'run',
    '--summary-export=results/summary.json',
    '-o', 'experimental-prometheus-rw',
    'test/mainTest.js'
  ], {
    stdio: 'inherit',
    env: { ...process.env, ...envVars }
  });

  if (result.status === 0) {
    console.log(`✅ ${name} 테스트 완료`);
  } else {
    console.error(`❌ ${name} 테스트 실패 (종료 코드: ${result.status})`);
  }
}