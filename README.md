# 💰 SAM (San Account Manager)

> **회계 장부 데이터를 체계적으로 정리하고 시각화하여 분석하기 위한 자산 관리 솔루션**

SAM은 복잡한 회계 데이터를 효율적으로 관리하고, 직관적인 대시보드를 통해 재정 상태를 한눈에 파악할 수 있도록 돕는 웹 애플리케이션입니다. 번거로운 회원가입 절차 없이 발급된 액세스 코드로 즉시 접속하여 안전하게 데이터를 관리할 수 있습니다.

---

## ✨ 핵심 기능 (Key Features)

### 🛠️ 관리자 모드 (Admin)
- **데이터 통합 관리**: 영수증, 결제인, 카테고리 등 모든 마스터 데이터의 CRUD 지원
- **분류 체계 설계**: 계층형(3단계) 카테고리 관리를 통한 체계적인 분류 시스템
- **보안 액세스**: 관리자 전용 코드를 통한 권한 제어 및 일반 사용자용 코드 발급

### 📈 분석가 모드 (Analyst)
- **실시간 대시보드**: 월별 지출 추이, 카테고리별 비중 등을 시각화된 차트로 분석
- **영수증 디지털화**: Google Drive 연동을 통한 영수증 이미지 보관 및 상세 내역 확인
- **예산 대비 현황**: 책정된 예산과 실제 지출액을 비교하여 효율적인 재정 운영 지원

---

## 🛠️ 기술 스택 (Tech Stack)

### Backend
- **Framework**: FastAPI (Python 3.13.12)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy / SQLModel
- **Security**: JWT (JSON Web Token) Access Code Authentication

### Frontend
- **Library**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack Query (React Query)
- **Visualization**: Recharts
- **Icons**: Lucide React

---

## 📂 프로젝트 구조 (Project Structure)

```text
.
├── app/                # Backend (FastAPI) 코드
│   ├── api/            # API 라우터 (v1)
│   ├── core/           # 설정, 보조 기능 (Config, Log)
│   ├── db/             # 데이터베이스 스키마 및 엔진
│   └── models/         # 데이터 모델 정의
├── frontend/           # Frontend (React + Vite) 코드
│   ├── src/
│   └── public/
├── data/               # 데이터베이스 마이그레이션 또는 로컬 데이터
├── docker-compose.yml  # Docker 실행 설정
└── plan.md             # 프로젝트 기획 및 정책 문서
```

---

## 🚀 시작하기 (Getting Started)

### 환경 설정 (Prerequisites)
- Python 3.13.12
- Node.js 24.14.1
- PostgreSQL Database

### 1. 백엔드 설정
```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정 (.env.example 참고)
cp .env.example .env
```

### 2. 프론트엔드 설정
```bash
cd frontend

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```

---

## 📊 데이터 구조 (Data Architecture)

- **Receipts**: 거래 내역의 핵심 데이터 (날짜, 금액, 카테고리, 결제인, 영수증 URL 등)
- **Payers**: 결제 담당자 및 계좌 정보 관리
- **Categories**: 대/중/소 3단계 계층 구조의 분류 체계
- **Budgets**: 회계 기간별, 분류별 예산안 관리
- **Codes**: 인증을 위한 관리자/일반 사용자용 액세스 코드

---

## 🔐 보안 고지
본 프로젝트는 **Access Code** 기반의 인증 방식을 사용합니다. 비밀번호 기반의 일반적인 회원가입 과정은 생략되어 있으며, 코드 유출 시 백엔드 단에서 환경 변수 또는 DB 수정을 통해 강제 변경이 필요합니다.

---