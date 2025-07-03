export const options = {
  scenarios: {
    steady_rps: {
      executor: 'constant-arrival-rate',
      rate: 5,                // 초당 요청 수
      timeUnit: '1s',
      duration: '15s',
      preAllocatedVUs: 5,     
      maxVUs: 10        // 최대 확보 가능한 VU 수
    }
  }
};