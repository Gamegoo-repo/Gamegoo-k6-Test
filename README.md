# Gamegoo-k6-Test

Gamegoo 서버의 성능 테스트를 자동화하기 위한 k6 기반 테스트 레포지토리입니다.

---

## 📁 Directory 구조

```
Gamegoo-k6-Test/
├── test/
│   ├── runK6.js             # testcases.json 기반 자동 실행 스크립트
│   ├── mainTest.js          # 공통 테스트 로직
├── data/
│   ├── testcases.json       # 테스트 케이스 정의 파일
│   ├── payloads/            # 각 API에 사용할 요청 데이터
│   │   ├── login.json
│   │   ├── otherProfile.json
│   │   ├── jwt.json         # 로그인용 계정 정보
│   └── results_summary.csv  # 결과 요약 파일
├── results/
│   └── summary.json         # k6 summary-export 결과
├── utils/
│   └── auth.js              # JWT 로그인 유틸 함수
├── .env                     # BASE_URL, 기본 계정 설정 등 환경 설정
```

---

## 🚀 테스트 실행 방법

```bash
node test/runK6.js
```

- 내부적으로 `data/testcases.json`을 순회하며 `active=true`인 항목만 테스트합니다.
- JWT가 필요한 테스트는 자동으로 토큰을 발급받아 헤더에 포함합니다.

---

## ✅ 각 파일 설명

| 파일명         | 설명                                              |
| -------------- | ------------------------------------------------- |
| runK6.js       | testcases.json을 기반으로 자동 실행. active 여부에 따라 테스트 필터링 |
| mainTest.js    | 실제 HTTP 요청 및 체크 수행. setup을 통해 토큰 및 payload 분배 |
| testcases.json | API별 메타 정보 (endpoint, method, JWT 여부 등) 정의 |
| payloads/*.json| API에 전달할 파라미터를 파일별로 정의 (쿼리, 바디, 패스 파라미터 포함 가능) |
| utils/auth.js  | 로그인 유틸. email/password로 accessToken 발급     |

---

## 🧪 테스트케이스 정의 방법

`data/testcases.json`에서 테스트할 API 정보를 아래와 같이 정의합니다:

```json
[
  {
    "active": "true",                          
    "name": "다른 사용자 프로필 조회",
    "endpoint": "/api/v2/profile/other",       
    "method": "GET",                           
    "jwt": true,                               
    "payloadFile": "otherProfile.json"         
  }
]
```

- `"jwt": false`이면 로그인 없이 요청됩니다.
- `"payloadFile"`이 없는 경우, payload가 없는 요청으로 처리됩니다.

---

## 📦 Payload 구성 방법

`payloads/*.json` 파일에는 아래와 같은 구조로 요청 데이터를 정의합니다:

```json
[
  {
    "path": {
      "matchingUuid": "abc123",
      "targetMatchingUuid": "def456"
    },
    "query": {
      "type": "fast"
    },
    "body": {
      "message": "Let's go!"
    }
  }
]
```

- `path`: endpoint에 `{matchingUuid}` 같이 변수로 정의된 값을 대체합니다.
- `query`: GET/DELETE 요청 시 URL에 쿼리로 붙습니다 (`?type=fast`)
- `body`: POST/PUT/PATCH 요청의 body에 포함됩니다

---

## 👥 VUser와 Payload 분배

- 모든 `payloadFile` 데이터는 `setup()` 함수에서 `__ENV.VUS` 수만큼 자동 슬라이싱됩니다.
- 각 VUser는 자신만의 payload 세트를 가지고 테스트를 수행합니다.
- 즉, 테스트 데이터가 겹치지 않도록 자동 분배되어 동시성 테스트에 적합합니다.

```js
const vus = parseInt(__ENV.VUS) || 1;
const chunkSize = Math.ceil(payloadList.length / vus);
const payloadChunks = Array.from({ length: vus }, (_, i) => {
  return payloadList.slice(i * chunkSize, (i + 1) * chunkSize);
});
```

---

## 🔐 JWT 발급 (자동 처리)

- JWT가 필요한 테스트는 `jwt.json`에서 계정 정보를 불러와 로그인 후 토큰을 발급받습니다.
- `setup()`에서 토큰을 전 VU에 미리 분배하여 재사용합니다.

```json
[
  { "email": "user1@example.com", "password": "12345678" },
  { "email": "user2@example.com", "password": "12345678" }
]
```

---

## 🧹 참고: teardown() 함수

- 현재 사용하고 있진 않지만, `teardown(data)` 함수를 활용하면 테스트 종료 후 리소스 정리, 결과 보고 전송 등에 사용할 수 있습니다.

```js
export function teardown(data) {
  // e.g. 테스트 종료 후 cleanup 작업
}
```

---

## 📊 결과 확인

- k6 실행 시 콘솔로 TPS, Latency, 실패율 등을 확인할 수 있습니다.
- 추가로 `results/summary.json` 파일로도 저장되며, 필요시 CSV로 가공할 수 있습니다:

```bash
python utils/result_to_csv.py
```
