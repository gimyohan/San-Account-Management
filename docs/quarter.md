# 📂 Quarter API Specifications

이 문서는 SAM 프로젝트의 분기(Quarter) 관리 API 명세를 다룹니다.

---

## 📅 4. 분기 관리 (Quarter)

### 📋 4.1 분기 리스트 조회 (By Year)
특정 연도에 속한 모든 분기 리스트를 조회합니다. 분기 순서(`order`)대로 정렬됩니다.

#### 요청 (Request)
- **Method**: `GET`
- **URL**: `/api/quarters`
- **Authentication**: `Bearer {Token}` (Required)

**[Query Parameters]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `year_id` | Integer | Required | 조회 대상을 필터링할 연도 ID |

---

#### 응답 (Response)

**[Response Body - data 리스트 내부 필드]**

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | Integer | 분기 고유 ID |
| `order` | Integer | 분기 순서 (예: `1`, `2`) |
| `name` | String | 분기 이름 (예: `1분기`, `상반기`) |
| `year_id` | Integer | 소속된 연도 ID |

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 조회 성공 |
| `401` | `INVALID_TOKEN` | 인증되지 않은 사용자 |

---

### 🆕 4.2 분기 생성 (Admin)
특정 연도 하위에 새로운 분기를 추가합니다.

#### 요청 (Request)
- **Method**: `POST`
- **URL**: `/api/quarters`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `year_id` | Integer | Required | 분기가 소속될 연도 ID |
| `order` | Integer | Required | 분기 순서 |
| `name` | String | Required | 분기 이름 |

---

#### 응답 (Response)
생성된 분기 객체를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `201` | - | 분기 생성 성공 |
| `404` | `NOT_FOUND` | 지정한 `year_id`를 찾을 수 없음 |
| `403` | `FORBIDDEN` | 관리자 권한이 없음 |

---

### 📝 4.3 분기 수정 (Admin)
분기 정보를 수정합니다.

#### 요청 (Request)
- **Method**: `PATCH`
- **URL**: `/api/quarters/{id}`
- **Authentication**: `Bearer {Token}` (Admin Required)

**[Request Body]**

| 필드 | 타입 | 필수 여부 | 설명 |
| :--- | :--- | :--- | :--- |
| `order` | Integer | Optional | 수정할 순서 |
| `name` | String | Optional | 수정할 이름 |

---

#### 응답 (Response)
수정된 분기 객체를 반환합니다.

**[응답 상태 코드]**

| HTTP 상태 코드 | 코드(Error) | 설명 |
| :--- | :--- | :--- |
| `200` | - | 수정 성공 |
| `404` | `NOT_FOUND` | 해당 ID의 분기를 찾을 수 없음 |

---

### 🗑️ 4.4 분기 삭제 (Admin)
분기를 삭제합니다. 영수증 데이터가 연결된 경우 삭제 정책(Restricted/Cascade)에 따라 결과가 달라집니다.

#### 요청 (Request)
- **Method**: `DELETE`
- **URL**: `/api/quarters/{id}`

#### 응답 (Response)
- **Body**: 없음 (`null`)
