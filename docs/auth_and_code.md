# 📂 SAM API Specifications

이 문서는 SAM 프로젝트의 상세 API 명세를 다룹니다.

---

## 🔐 1. 인증 및 액세스 코드 관리 (Auth)

### 🔑 1.1 로그인 (Token)
액세스 코드를 입력하여 시스템 접속 토큰(JWT)을 발급받습니다.

#### 요청 (Request)
- **Method**: `POST`
- **URL**: `/api/auth/token`
- **Content-Type**: `application/x-www-form-urlencoded`

**[Request Body (Form)]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `username` | String | Required | 액세스 코드 입력 (Swagger 호환을 위해 username 필드 사용) |
| `password` | String | Optional | (기본적으로 사용되지 않음) |

---

#### 응답 (Response)

**[Response Body]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `access_token` | String | API 호출 시 Bearer 헤더에 사용할 JWT 토큰 |
| `token_type` | String | 토큰 타입 (기본값: `bearer`) |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드 | 설명 |
| :--- | :--- | :--- |
| `200` | `SUCCESS` | 로그인 성공 및 토큰 발급 |
| `401` | `INVALID_CODE` | 존재하지 않거나 잘못된 액세스 코드 |

---

### 👤 1.2 내 권한 조회 (Me)
현재 로그인한 사용자의 정보를 확인합니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Authentication**: `Bearer {Token}`

#### 응답 (Response)

**[Response Body]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `role` | String | 현재 사용자의 권한 등급 (`admin`, `general`) |

---

### 📋 1.3 액세스 코드 리스트 조회 (Admin)
관리자 권한으로 시스템에 등록된 모든 액세스 코드를 조회합니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/auth/codes`

**[Query Parameters]**

| 필드 | 타입 | 필수 여부 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `offset` | Integer | Optional | `0` | 조회를 시작할 인덱스 (0 이상) |
| `limit` | Integer | Optional | `5` | 한 페이지당 노출할 개수 (0 이상) |
| `sort_key` | String | Optional | `last_accessed_at` | 정렬 기준 (`last_accessed_at`, `access_count`, `code`) |

---

#### 응답 (Response)

**[Response Body]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `total` | Integer | 전체 데이터 개수 |
| `offset` | Integer | 현재 요청된 오프셋 |
| `limit` | Integer | 현재 요청된 한정 개수 |
| `sort_key` | String | 적용된 정렬 키 |
| `codes` | List | 아래 상세 필드를 포함하는 리스트 |

**[codes 내부 상세 필드]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | Integer | 코드 고유 ID |
| `code` | String | 실제 액세스 코드 문자열 |
| `role` | String | 권한 등급 (`admin`, `general`) |
| `memo` | String | 코드 관련 메모 |
| `access_count` | Integer | 해당 코드로 로그인한 횟수 |
| `last_accessed_at` | DateTime | 마지막 접속 일시 (ISO 8601) |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드 | 설명 |
| :--- | :--- | :--- |
| `200` | `SUCCESS` | 조회 성공 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |
| `422` | `VALIDATION_ERROR` | 파라미터 제약 조건 위반 |

---

### 🆕 1.4 액세스 코드 생성 (Admin)
새로운 액세스 코드를 발급합니다.

#### 요청 (Request)
- **Method**: `POST`
- **URL**: `/api/auth/codes`

**[Query Parameters]**

| 필드 | 타입 | 필수 여부 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `code` | String | Optional | `null` | 직접 지정할 코드 문자열 (4~32자) |
| `memo` | String | Optional | `""` | 코드 용도에 대한 메모 (최대 255자) |
| `length` | Integer | Optional | `4` | 랜덤 생성 시 추출할 코드 길이 (4~32자) |

`code`가 `null`인 경우에만 `length`를 사용하여 랜덤으로 생성합니다.

---

#### 응답 (Response)
생성된 코드 객체를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드 | 설명 |
| :--- | :--- | :--- |
| `201` | `SUCCESS` | 코드 생성 성공 |
| `409` | `CODE_EXISTS` | 이미 존재하는 코드 지정 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 📝 1.5 액세스 코드 메모 수정 (Admin)
특정 액세스 코드의 메모 내용을 수정합니다.

#### 요청 (Request)
- **Method**: `PATCH`
- **URL**: `/api/auth/codes/{id}/memo`

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 기본값 | 설명 |
| :--- | :--- | :--- | :--- | :--- |
| `memo` | String | Optional | `""` | 수정할 메모 내용 (최대 255자) |

---

#### 응답 (Response)
수정된 코드 객체와 함께 **수정 전 메모** 내용을 반환합니다.

**[Response Body 상세 추가 필드]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `prev_memo` | String | 수정 전의 기존 메모 내용 |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드 | 설명 |
| :--- | :--- | :--- |
| `200` | `SUCCESS` | 메모 수정 성공 |
| `404` | `NOT_FOUND` | 해당 ID의 코드를 찾을 수 없음 |
| `409` | `CANNOT_UPDATE_ADMIN` | 관리자 계정 수정 불가 |

---

### 🗑️ 1.6 액세스 코드 삭제 (Admin)
특정 액세스 코드를 시스템에서 영구히 삭제합니다.

#### 요청 (Request)
- **Method**: `DELETE`
- **URL**: `/api/auth/codes/{id}`

#### 응답 (Response)
- **Body**: 없음 (`null`)

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드 | 설명 |
| :--- | :--- | :--- |
| `204` | `SUCCESS` | 삭제 성공 |
| `404` | `NOT_FOUND` | 삭제할 코드가 존재하지 않음 |
| `409` | `CANNOT_DELETE_ADMIN` | 관리자 코드는 삭제 불가 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |
