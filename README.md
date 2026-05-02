## github 커밋 메시지 규칙

아래는 커밋 메시지 작성 시 사용하는 태그입니다. 커밋 메시지는 반드시 명확한 목적과 함께 아래 규칙을 따릅니다.


| 태그      | 설명                           | 예시                           |
|-----------|--------------------------------|--------------------------------|
| FEAT      | 새로운 기능 개발에 대한 커밋     | `[FEAT] 로그인 기능 추가`        |
| FIX       | 버그 수정에 대한 커밋            | `[FIX] 로그인 오류 수정`         |
| BUILD     | 빌드 관련 파일 수정 / 모듈 설치 또는 삭제에 대한 커밋 | -            |
| CHORE     | 그 외 자잘한 수정에 대한 커밋 | -         |
| CI        | ci 관련 설정 수정에 대한 커밋  | `[CI] GitHub Actions 설정 변경`      |
| DOCS      | 문서 수정에 대한 커밋     | `[DOCS] README 수정` |
| CHORE     | 빌드, 패키지 매니저 설정 등     | `[CHORE] 패키지 업데이트`        |
| STYLE     | 코드 스타일 혹은 포맷 등에 관한 커밋   | `[STYLE] 코드 포맷 정리`           |
| REFACTOR  | 코드 리팩토링에 대한 커밋     | `[REFACTOR] 중복 로직 제거`  |
| TEST      | 테스트 코드 수정에 대한 커밋   | `[TEST] 로그인 유닛 테스트 추가`           |
| PERF      | 성능 개선에 대한 커밋      | `[PERF] 렌더링 최적화`  |

> 커밋 메시지 예시: [Feat] Onboarding 페이지 구현 완료, Findemail 기능 개발 <br/>
> `태그: 변경 내용 간략히 설명`

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
