# OLma Frontend

OLma의 웹 프론트엔드 레포지토리입니다. 서비스의 사용자 화면과 백엔드 API 연동을 담당합니다.

상세한 화면 흐름, 라우팅 구조, API 연동 정책은 `OLma-Docs`에서 관리합니다.

## 담당 범위

- 랜딩 페이지
- 로그인 및 회원가입
- 온보딩 플로우
- 스마트 견적 계산기
- 견적 저장 및 이전 견적서 불러오기
- 시장 단가 분석 대시보드
- 커리어 관리
- 커뮤니티
- 마이페이지 및 계정 설정

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- lucide-react
- html2canvas-pro

## 로컬 실행

```bash
npm install
npm run dev
```

기본 실행 주소는 `http://localhost:3000`입니다.

## 빌드 및 검사

```bash
npm run build
npm run lint
```

## 관련 레포

- Backend: https://github.com/Olma-Web/OLma-BE
- Docs: https://github.com/Olma-Web/OLma-Docs

## 관련 문서

- 프론트엔드 개요: https://olma-web.github.io/OLma-Docs/frontend/overview
- 라우팅 구조: https://olma-web.github.io/OLma-Docs/frontend/routing
- API 연동: https://olma-web.github.io/OLma-Docs/frontend/api-integration
- 인증 흐름: https://olma-web.github.io/OLma-Docs/frontend/auth-flow
- 주요 도메인 흐름: https://olma-web.github.io/OLma-Docs/frontend/domain-flows

> 운영 도메인 종료 후에는 GitHub Pages 또는 `OLma-Docs` 레포지토리의 로컬 실행으로 문서를 확인할 수 있습니다.
