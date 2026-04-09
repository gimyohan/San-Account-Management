import axios from 'axios';

// 백엔드 공통 응답 규격
export interface SuccessResponse<T> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  path?: string;
}

const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // HttpOnly Cookie (JWT) 통신을 위해 필수
});

// 응답 인터셉터: 데이터 구조 통합 및 에러 핸들링 기초
apiClient.interceptors.response.use(
  (response) => response.data, // 바로 .data를 반환하여 호출 측에서 SuccessResponse를 받게 함
  (error) => {
    if (error.response) {
      const { status, config } = error.response;

      // 401 Unauthorized (토큰 만료) 또는 403 Forbidden (권한 부족) 실시간 탐지
      if ((status === 401 || status === 403) && !config.url?.includes('/auth/me')) {
        // 무한 루프 차단: 즉시 서버에 로그아웃을 요청하여 인증 쿠키를 만료시킵니다.
        // 이 요청은 실패해도 상관 없으며, 완료 후 홈으로 이동시킵니다.
        axios.post('/api/auth/logout').finally(() => {
          window.location.href = '/';
        });
      }

      // 백엔드에서 정의한 ErrorResponse 규격에 맞춰 에러를 던짐
      return Promise.reject(error.response.data as ErrorResponse);
    }
    return Promise.reject({ error: 'NETWORK_ERROR', detail: '서버에 연결할 수 없습니다.' });
  }
);

export default apiClient;
