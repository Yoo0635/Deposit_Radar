# Deposit Radar (보증금 레이더)

## 프로젝트 구조

> **파일 확장자 설명**
>
> - **`.tsx`**: TypeScript + JSX (React 컴포넌트 파일) - UI 컴포넌트, 화면 파일
> - **`.ts`**: TypeScript (순수 TypeScript 파일) - 주로 스타일 정의 파일 (`*Styles.ts`), API, 유틸리티, 타입 정의

````
Deposit_Radar/
├── app/                          ← Expo Router 기반 파일 라우팅
│   ├── _layout.tsx              ← 루트 레이아웃 (인증 상태 관리, 알림 처리)
│   ├── (auth)/                  ← 인증 관련 화면 그룹
│   │   ├── _layout.tsx          ← 인증 화면 레이아웃 (스택 네비게이션)
│   │   ├── login/               ← 로그인 화면
│   │   │   ├── index.tsx        ← 로그인 컴포넌트 (아이디/비밀번호 입력)
│   │   │   └── loginStyles.ts   ← 로그인 화면 스타일
│   │   └── signup/              ← 회원가입 화면
│   │       ├── index.tsx        ← 회원가입 컴포넌트
│   │       └── signupStyles.ts  ← 회원가입 화면 스타일
│   ├── (tabs)/                  ← 하단 탭 네비게이션 그룹
│   │   ├── _layout.tsx         ← 탭 레이아웃 (대시보드/분석/설정)
│   │   ├── index/               ← 대시보드 탭
│   │   │   ├── index.tsx        ← 주택 목록 화면 (아코디언 상세보기)
│   │   │   └── indexStyles.ts   ← 대시보드 스타일
│   │   ├── analysis/            ← 분석 탭
│   │   │   ├── index.tsx        ← 위험도 분석 요청 및 PDF 미리보기
│   │   │   └── analysisStyles.ts ← 분석 화면 스타일
│   │   └── explore/             ← 설정 탭
│   │       ├── index.tsx        ← 설정 화면 (로그아웃 등)
│   │       └── exploreStyles.ts ← 설정 화면 스타일
│   ├── modal/                   ← 주택 등록 모달
│   │   ├── index.tsx            ← 주택 정보 입력 (주소, 보증금, 날짜)
│   │   └── modalStyles.ts       ← 모달 스타일
│   └── upload/                  ← 등기부등본 업로드 화면
│       ├── index.tsx            ← 카메라/갤러리 이미지 업로드
│       └── uploadStyles.ts      ← 업로드 화면 스타일
│
├── api/                          ← 백엔드 API 통신 모듈
│   ├── auth.ts                  ← 인증 API (로그인, 회원가입, 토큰)
│   └── registry.ts              ← 등기부등본 API (조회, 업로드, 변경 감지)
│
├── components/                   ← 재사용 가능한 컴포넌트
│   └── riskBadge.tsx            ← 위험도 배지 (RED/AMBER/GREEN)
│
├── constants/                    ← 상수 및 전역 설정
│   └── styles.ts                ← 전역 스타일 (색상, 타이포그래피, 간격)
│
├── context/                     ← 전역 상태 관리 (Context API)
│   └── AuthContext.tsx          ← 인증 상태 관리 (로그인/로그아웃)
│
├── contexts/                    ← 전역 상태 관리 (Context API)
│   └── PropertyContext.tsx      ← 주택 목록 상태 관리 (CRUD)
│
├── hooks/                       ← 커스텀 React 훅
│   ├── use-color-scheme.ts      ← 색상 스키마 훅
│   ├── use-color-scheme.web.ts  ← 웹용 색상 스키마 훅
│   └── use-theme-color.ts       ← 테마 색상 훅
│
├── assets/                      ← 정적 리소스
│   ├── images/                  ← 이미지 파일
│   └── logo.png                 ← 앱 로고
│
├── android/                      ← 네이티브 Android 프로젝트 (자동 생성)
│   ├── app/                      ← Android 앱 모듈
│   │   ├── build.gradle          ← 앱 빌드 설정
│   │   ├── src/main/             ← Android 소스 코드
│   │   │   └── AndroidManifest.xml ← Android 매니페스트
│   ├── build.gradle              ← 프로젝트 빌드 설정
│   ├── settings.gradle           ← 프로젝트 설정
│   └── gradle/                   ← Gradle 래퍼
│
├── ios/                          ← 네이티브 iOS 프로젝트 (자동 생성, 미사용)
│   ├── Podfile                   ← CocoaPods 의존성
│   └── sesac.xcodeproj/          ← Xcode 프로젝트
│
├── scripts/                      ← 유틸리티 스크립트
│   └── reset-project.js          ← 프로젝트 초기화 스크립트
│
├── types/                         ← TypeScript 타입 정의
│
├── notificationListener.ts        ← Android 알림 리스너 (Headless JS)
│
├── app.json                       ← Expo 앱 설정 (이름, 버전, 플러그인)
├── package.json                   ← 프로젝트 의존성 및 스크립트
├── package-lock.json              ← 의존성 버전 고정
├── tsconfig.json                  ← TypeScript 설정
├── metro.config.js               ← Metro 번들러 설정
├── eslint.config.js               ← ESLint 설정
└── expo-env.d.ts                  ← Expo 타입 정의


## Get started

1. Install dependencies

   ```bash
   npm install
````

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
