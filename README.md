# Gamegoo-k6-Test
Gamegoo 서버 테스트용 레포지토리

## Directory Structure
Gamegoo-k6-Test/
├── test/
│   ├── runK6.js                 # testcases.json 기반 자동 실행 스크립트
│   ├── mainTest.js             # 실제 테스트 로직 (공통)
├── data/
│   ├── testcases.json          # API별 테스트케이스 정의
│   ├── payloads/
│   │   ├── createOrder.json    # POST 요청용 Body JSON
│   └── results_summary.csv     # 결과 요약 파일
├── results/
│   └── summary.json            # k6 summary-export 저장 파일
├── utils/
│   └── auth.js                 # 로그인(access token 발급) 유틸
├── .env                        # 기본 BASE_URL, 로그인 정보 등 환경 설정


### json -> csv 결과 저장
python utils/result_to_csv.py

## file
### runK6.js
	•	data/testcases.json을 순회하며 각 테스트 환경 구성
	•	k6 run 실행 시마다 환경변수 자동 설정
	•	K6_TLS_SKIP_VERIFY=true로 TLS 인증 무시
	•	jwt가 true일 경우, utils/auth.js를 통해 로그인 → accessToken 설정됨
    ```node test/runK6.js```

### mainTest.js
	•	POST/GET 등 method에 따라 payload 사용 여부 분기
	•	__ENV를 통해 외부에서 주입된 값 사용
	•	인증 필요시 토큰 자동 발급 및 Authorization 헤더 포함

### utils.auth.js
	•	JWT 인증이 필요한 API 테스트 시 자동 로그인 수행
	•	__ENV.TEST_EMAIL, __ENV.TEST_PASSWORD로 계정 설정