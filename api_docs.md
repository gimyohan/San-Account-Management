# 📑 SAM (Account Manager) API 명세서

이 문서는 SAM 프로젝트의 프론트엔드와 백엔드 간의 통신을 위한 규격을 정의합니다.

- **Base URL**: `https://api.sam.javago.my`
- **인증 방식**: JWT (HttpOnly Cookie)

---

## 🌐 0. 공통 응답 및 에러 규격 (Common Guidelines)

### ✅ 성공 응답 (Success)
- **Status**: `200 OK`, `201 Created`
- **Body**: `{ "data": Object | Array, "message": "성공 메시지 (옵션)" }`

### ❌ 에러 응답 (Error)
- **Status**: `400`, `401`, `403`, `404`, `409`, `500`
- **Body**:
  ```json
  {
    "error": "ERROR_CODE",
    "detail": "에러 상세 내용 (프론트엔드 Toast 노출용)",
    "path": "/api/v1/..."
  }
  ```

---

## 🔐 1. 인증 (Authentication)

> **인증 방식**: 별도 회원가입 없이 발급된 **Access Code**를 통해 접속합니다.
> JWT는 **HttpOnly, Secure, SameSite=Strict** 쿠키로 관리하며, 프론트엔드에서 직접 토큰에 접근할 수 없습니다.

### 🔑 1.1 로그인 (Code 인증)
- **Endpoint**: `POST /api/auth/login`
- **Description**: Access Code를 검증하고, 유효한 경우 JWT를 HttpOnly Cookie로 발급합니다.
- **Request Body**:
  ```json
  {
    "code": "string"
  }
  ```
- **Response (200 OK)**:
  - `Set-Cookie: access_token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
  ```json
  {
    "data": { "role": "admin" | "general" },
    "message": "로그인에 성공하였습니다."
  }
  ```
- **Error (401 Unauthorized)**:
  ```json
  {
    "error": "INVALID_CODE",
    "detail": "유효하지 않은 코드입니다. 다시 확인해주세요."
  }
  ```

### 🚪 1.2 로그아웃
- **Endpoint**: `POST /api/auth/logout`
- **Description**: HttpOnly Cookie를 만료시켜 JWT를 무효화합니다.
- **Response (200 OK)**:
  - `Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  ```json
  {
    "data": null,
    "message": "로그아웃되었습니다."
  }
  ```

### 🔄 1.3 토큰 갱신 (Refresh)
- **Endpoint**: `POST /api/auth/refresh`
- **Description**: 만료 임박 시 기존 JWT를 검증한 뒤 새 JWT를 재발급합니다. 프론트엔드에서 주기적으로 호출하여 세션 유지에 사용합니다.
- **Request**: 별도 body 없음 (기존 Cookie의 JWT 사용)
- **Response (200 OK)**:
  - `Set-Cookie: access_token=<NEW_JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
  ```json
  {
    "data": { "role": "admin" | "general" },
    "message": "토큰이 갱신되었습니다."
  }
  ```
- **Error (401 Unauthorized)**:
  ```json
  {
    "error": "TOKEN_EXPIRED",
    "detail": "세션이 만료되었습니다. 다시 로그인해주세요."
  }
  ```

### 👤 1.4 현재 세션 조회 (Me)
- **Endpoint**: `GET /api/auth/me`
- **Description**: 현재 JWT의 유효성 및 사용자 역할을 반환합니다. 프론트엔드 초기 로딩 시 로그인 상태 확인에 사용합니다.
- **Request**: 별도 body 없음 (Cookie의 JWT 사용)
- **Response (200 OK)**:
  ```json
  {
    "data": { "role": "admin" | "general" }
  }
  ```
- **Error (401 Unauthorized)**:
  ```json
  {
    "error": "NOT_AUTHENTICATED",
    "detail": "로그인이 필요합니다."
  }
  ```

---

### 🗝️ JWT 토큰 설계

#### Payload 구조
```json
{
  "sub": "code_id",        // codes 테이블의 PK (정수)
  "role": "admin|general", // 역할 구분
  "iat": 1712400000,       // 발급 시간 (Unix)
  "exp": 1712486400        // 만료 시간 (Unix, 발급 후 24시간)
}
```

#### 보안 정책
| 항목 | 값 | 비고 |
|:---|:---|:---|
| 알고리즘 | `HS256` | 서버 SECRET_KEY로 서명 |
| 유효 기간 | `24시간` | Max-Age=86400 |
| Cookie 속성 | `HttpOnly, Secure, SameSite=Strict` | XSS/CSRF 방지 |
| 동시 접속 | **허용** | 동일 Code로 여러 기기 접속 가능 |
| 토큰 블랙리스트 | 미적용 | 편의성 우선, 추후 Redis 기반 확장 가능 |

---

### 🔧 1.5 액세스 코드 관리 (Admin 전용)

> Admin만 액세스 코드를 관리할 수 있습니다. 요청 시 JWT의 `role`이 `admin`이 아닌 경우 `403 Forbidden`을 반환합니다.
> 관리 대상은 **일반(general) 코드만** 해당됩니다. Admin 코드는 이 API로 조회/생성/삭제할 수 없습니다.

#### 📋 1.5.1 일반 코드 목록 조회
- **Endpoint**: `GET /api/auth/codes`
- **Description**: 발급된 모든 일반(general) 코드를 조회합니다. Admin 코드는 목록에 포함되지 않습니다.
- **Response (200 OK)**:
  ```json
  {
    "data": [
      { "id": 2, "code": "SAM-ABCD-1234", "memo": "분기별 결산용", "last_accessed_at": "2024-04-06T15:30:00Z" },
      { "id": 3, "code": "SAM-EFGH-5678", "memo": null, "last_accessed_at": null }
    ]
  }
  ```
  > `last_accessed_at`은 해당 코드로 마지막 로그인을 시도한 시간입니다. 한 번도 사용하지 않은 경우 `null`입니다.

#### ➕ 1.5.2 일반 코드 생성
- **Endpoint**: `POST /api/auth/codes`
- **Description**: 새로운 일반(general) 코드를 발급합니다. Request Body 없이 호출하면 서버에서 코드를 자동 생성합니다.
- **Request Body**: 없음
- **Response (201 Created)**:
  ```json
  {
    "data": { "id": 4, "code": "SAM-WXYZ-9012", "memo": null, "last_accessed_at": null },
    "message": "새로운 액세스 코드가 발급되었습니다."
  }
  ```
- **Error (403 Forbidden)**:
  ```json
  {
    "error": "FORBIDDEN",
    "detail": "관리자 권한이 필요합니다."
  }
  ```

#### ❌ 1.5.3 코드 삭제 (폐기)
- **Endpoint**: `DELETE /api/auth/codes/:id`
- **Description**: 지정된 일반 코드를 폐기합니다. Admin 코드의 id를 전달하면 삭제가 거부됩니다.
- **Response (204 No Content)**: 본문 없음
- **Error (400 Bad Request)**:
  ```json
  {
    "error": "CANNOT_DELETE_ADMIN",
    "detail": "관리자 코드는 삭제할 수 없습니다."
  }
  ```

---

## 🧾 2. 영수증 관리 (Receipts API)

### 📋 2.1 목록 조회
- **Endpoint**: `GET /api/receipts`
- **Query Params**: `startDate`, `endDate`, `categoryId`, `payerId`
- **Response**: `{ "data": [...] }`

### ➕ 2.2 영수증 등록 (Admin)
- **Endpoint**: `POST /api/receipts`
- **Request Body**:
  ```json
  {
    "categoryId": 1,
    "payerId": 2,
    "description": "품목명",
    "income": 0,
    "expense": 20000,
    "discount": 10000,
    "transactionAt": "2024-04-06T10:00:00Z",
    "receiptUrl": "https://..."
  }
  ```

---

## 📁 3. 분류 관리 (Categories API)

### 📋 3.1 전체 목록 조회 (Tree)
- **Endpoint**: `GET /api/categories`
- **Response**: `{ "data": [ { "id": 1, "name": "식비", ..., "children": [...] } ] }`

### ➕ 3.2 분류 추가
- **Endpoint**: `POST /api/categories`
- **Request Body**:
  ```json
  {
    "name": "카페",
    "parentId": 2  // 루트인 경우 null 또는 생락
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "data": { "id": 10, "name": "카페", "parentId": 2, "level": 3 },
    "message": "분류가 성공적으로 추가되었습니다."
  }
  ```

### 📝 3.3 분류 수정
- **Endpoint**: `PATCH /api/categories/:id`
- **Request Body**: `{ "name": "수정할 이름", "parentId": 1 }`
- **Response (200 OK)**: 수정된 객체 반환

### ❌ 3.4 분류 삭제
- **Endpoint**: `DELETE /api/categories/:id`
- **제약**: 하위 분류(`children`)가 존재하면 삭제 불가 (`409 Conflict`)
- **실패 시 응답**:
  ```json
  {
    "error": "HAS_CHILDREN",
    "detail": "하위 분류가 존재하여 삭제할 수 없습니다. 먼저 하위 분류를 삭제해주세요."
  }
  ```
- **성공 시 처리**: 영수증 내 관련 `categoryId` -> `null` 처리

---

## 👥 4. 결제인 관리 (Payers API)

### 📋 4.1 목록 조회
- **Endpoint**: `GET /api/payers`
- **Response**:
  ```json
  {
    "data": [
      { "id": 1, "name": "김결제", "account": "카카오뱅크 3333..." }
    ]
  }
  ```

### ➕ 4.2 결제인 추가 (Admin)
- **Endpoint**: `POST /api/payers`
- **Request Body**:
  ```json
  {
    "name": "홍길동",
    "account": "신한은행 110-123-456789"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "data": { "id": 2, "name": "홍길동", "account": "신한은행 110-123-456789" },
    "message": "결제인이 성공적으로 추가되었습니다."
  }
  ```

### 📝 4.3 결제인 수정 (Admin)
- **Endpoint**: `PATCH /api/payers/:id`
- **Request Body**:
  ```json
  {
    "name": "홍길동(수정)",
    "account": "국민은행 123456-78-901234"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "data": { "id": 2, "name": "홍길동(수정)", "account": "국민은행 123456-78-901234" },
    "message": "결제인 정보가 성공적으로 수정되었습니다."
  }
  ```

### ❌ 4.4 결제인 삭제 (Admin)
- **Endpoint**: `DELETE /api/payers/:id`
- **Description**: 지정된 결제인 정보를 삭제합니다.
- **제약**: 해당 결제인과 연결된 영수증이 존재하면 삭제 불가 (`409 Conflict`)
- **Response (204 No Content)**: 본문 없음
- **실패 시 응답**:
  ```json
  {
    "error": "HAS_RECEIPTS",
    "detail": "연결된 영수증 내역이 존재하여 삭제할 수 없습니다."
  }
  ```

---

## 📈 5. 통계 분석 (Analytics API)

### 🥧 5.1 분류별 지출 비중
- **Endpoint**: `GET /api/stats/category-ratio`
- **Response**: `{ "data": [ { "name": "식비", "value": 150000 }, ... ] }`

### 📉 5.2 월별 지출 추이
- **Endpoint**: `GET /api/stats/monthly-trend`
- **Response**: `{ "data": [ { "month": "2024-04", "expense": 500000 }, ... ] }`
