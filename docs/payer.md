# 📂 Payer API Specifications

이 문서는 SAM 프로젝트의 결제인(Payer) 관리 API 명세를 다룹니다.

---

## 💳 2. 결제인 관리 (Payer)

### 📋 2.1 결제인 리스트 조회
시스템에 등록된 모든 결제인 리스트를 조회합니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/payers`
- **Authentication**: `Bearer {Token}` (Required)

#### 응답 (Response)

**[Response Body - data 리스트 내부 필드]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | Integer | 결제인 고유 ID |
| `name` | String | 결제인 이름 |
| `account` | String | 결제 계좌 정보 (예: `kakao-pay`, `KB 123-4567-890`) |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 조회 성공 |
| `401` | `INVALID_TOKEN` | 인증되지 않은 사용자 |

---

### 🔍 2.2 단건 결제인 조회 (Admin)
특정 ID를 가진 결제인의 상세 정보를 조회합니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/payers/{id}`
- **Authentication**: `Bearer {Token}` (Admin Required)

#### 응답 (Response)
- 2.1 응답의 `data` 내부 필드와 동일한 단건 객체 반환

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 조회 성공 |
| `404` | `NOT_FOUND` | 해당 ID의 결제인을 찾을 수 없음 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 🆕 2.3 결제인 생성 (Admin)
새로운 결제인을 시스템에 추가합니다.

#### 요청 (Request)
- **Method**: `POST`
- **URL**: `/api/payers`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `name` | String | Required | 결제인 이름 |
| `account` | String | Optional | 결제 계좌 정보 (기본값: `null`) |

---

#### 응답 (Response)
생성된 결제인 객체와 성공 메시지(`message`)를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `201` | - | 결제인 생성 성공 |
| `422` | `VALIDATION_ERROR` | 데이터 형식 오류 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 📝 2.4 결제인 수정 (Admin)
기존 결제인의 정보를 수정합니다. (Partial Update 지원)

#### 요청 (Request)
- **Method**: `PATCH`
- **URL**: `/api/payers/{id}`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `name` | String | Optional | 수정할 이름 |
| `account` | String | Optional | 수정할 계좌 정보 |

---

#### 응답 (Response)
수정된 결제인 객체와 성공 메시지(`message`)를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 결제인 수정 성공 |
| `404` | `NOT_FOUND` | 수정할 결제인이 존재하지 않음 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 🗑️ 2.5 결제인 삭제 (Admin)
결제인을 삭제합니다. 연결된 영수증 내역이 있으면 삭제가 불가능합니다.

#### 요청 (Request)
- **Method**: `DELETE`
- **URL**: `/api/payers/{id}`
- **Authentication**: `Bearer {Token}` (Admin Required)

#### 응답 (Response)
- **Body**: 없음 (`null`)

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `204` | - | 삭제 성공 |
| `404` | `NOT_FOUND` | 삭제할 결제인이 존재하지 않음 |
| `409` | `HAS_RECEIPTS` | 연결된 영수증 내역이 존재하여 삭제 불가 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |
