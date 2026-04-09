# 🌌 SAM Server API Specification

**Base URL**: `/api` | **Auth**: HttpOnly `access_token` cookie

### 🔐 1. Authentication & System Codes
| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login & set cookie | `{ username, password }` |
| `POST` | `/auth/logout` | Logout & clear cookie | - |
| `GET` | `/auth/me` | Current user role | Res: `{ role }` |
| `GET` | `/auth/codes` | List access codes | `?limit=5` |
| `POST` | `/auth/codes` | Generate new code | - |
| `PATCH` | `/auth/codes/:id` | Update code memo | `{ memo }` |
| `DELETE` | `/auth/codes/:id` | Revoke code | - |

### 📅 2. Fiscal Infrastructure (Years & Periods)
| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/years` | List all fiscal years | - |
| `POST` | `/years` | Create fiscal year | `{ year, name? }` |
| `PUT` | `/years/:id` | Update year info | `{ year, name? }` |
| `DELETE` | `/years/:id` | Remove year | - |
| `GET` | `/quarters` | List periods for year | `?year_id={id}` |
| `POST` | `/quarters` | Create new period | `{ year_id, order, name }` |
| `PATCH` | `/quarters/:id` | Update period info | `{ order?, name? }` |
| `DELETE` | `/quarters/:id` | Remove period | - |

### 🏷️ 3. Categories & Receipts
| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Get category tree | `?year_id={id}` |
| `POST` | `/categories` | Create category | `{ year_id, name, amount?, parent_id? }` |
| `PATCH` | `/categories/:id` | Update category | `{ name?, amount?, parent_id? }` |
| `DELETE` | `/categories/:id` | Remove category | - |
| `GET` | `/receipts` | Filtered receipts | `?year_id&quarter_id&category_id&is_transferred...` |
| `POST` | `/receipts` | Register receipt | `{ quarter_id, category_id, payer_id?, description, income?, expense?, transaction_at... }` |
| `PATCH` | `/receipts/:id` | Update receipt | Same as POST |
| `DELETE` | `/receipts/:id` | Remove receipt | - |

### 👥 4. Payers & 📈 Analytics
| Method | Endpoint | Description | Payload / Params |
| :--- | :--- | :--- | :--- |
| `GET` | `/payers` | List all payers | - |
| `POST` | `/payers` | Add new payer | `{ name, account? }` |
| `PATCH` | `/payers/:id` | Update payer info | `{ name?, account? }` |
| `DELETE` | `/payers/:id` | Remove payer | - |
| `GET` | `/stats/balance` | Financial summary | `?start_date&end_date` (ISO Strings) |

---
**Note**: All successful responses follow the format `{ "data": T, "message": string }`. Role `admin` required for all write operations.
