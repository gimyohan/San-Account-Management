# 📂 Year API Specifications

이 문서는 SAM 프로젝트의 회계 연도(Year) 관리 API 명세를 다룹니다.

---

## 🗓️ 3. 회계 연도 관리 (Year)

### 📋 3.1 회계 연도 리스트 조회
시스템에 등록된 모든 회계 연도 리스트를 조회합니다. 최신 연도 순(desc)으로 정렬됩니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/years`
- **Authentication**: `Bearer {Token}` (Required)

#### 응답 (Response)

**[Response Body - data 리스트 내부 필드]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | Integer | 연도 고유 ID |
| `year` | Integer | 연도 숫자 (예: `2024`) |
| `name` | String | 연도 별칭 (예: `24학년도`, `null` 가능) |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 조회 성공 |
| `401` | `INVALID_TOKEN` | 인증되지 않은 사용자 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 🆕 3.2 회계 연도 생성 (Admin)
새로운 회계 연도를 생성합니다. 중복된 연도는 생성이 거부됩니다.

#### 요청 (Request)
- **Method**: `POST`
- **URL**: `/api/years`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `year` | Integer | Required | 생성할 연도 (예: `2024`) |
| `name` | String | Optional | 연도 별칭 (최대 32자) |

---

#### 응답 (Response)
생성된 연도 객체를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `201` | - | 연도 생성 성공 |
| `409` | `CONFLICT` | 이미 존재하는 연도 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 📝 3.3 회계 연도 수정 (Admin)
특정 연도의 정보를 수정합니다.

#### 요청 (Request)
- **Method**: `PUT`
- **URL**: `/api/years/{id}`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `year` | Integer | Required | 수정할 연도 숫자 |
| `name` | String | Optional | 수정할 연도 별칭 |

---

#### 응답 (Response)
수정된 연도 객체를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 수정 성공 |
| `404` | `NOT_FOUND` | 해당 ID의 연도를 찾을 수 없음 |
| `409` | `CONFLICT` | 다른 데이터와 연도 숫자가 중복됨 |

---

### 🗑️ 3.4 회계 연도 삭제 (Admin)
회계 연도를 삭제합니다. 하위 분기 및 카테고리 데이터가 있는 경우 함께 삭제될 수 있습니다 (Cascade 정책 확인 필요).

#### 요청 (Request)
- **Method**: `DELETE`
- **URL**: `/api/years/{id}`

#### 응답 (Response)
- **Body**: 없음 (`null`)

---
