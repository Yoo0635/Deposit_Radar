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
   ```

2. Android 앱 실행

   **이 프로젝트는 Expo를 사용합니다:**
   - Expo Router를 사용한 파일 기반 라우팅
   - Expo SDK를 사용한 네이티브 모듈 접근
   - `npm run android`는 `expo run:android`를 실행합니다
   - **Expo Go가 아닌 Development Build**를 사용합니다 (네이티브 모듈 사용 가능)

   **에뮬레이터에서 실행:**
   ```bash
   npm run android
   ```
   - Android 에뮬레이터가 실행 중이어야 합니다
   - 또는 실제 Android 기기가 USB로 연결되어 있어야 합니다
   - 첫 실행 시 네이티브 앱을 빌드하므로 시간이 걸릴 수 있습니다

   **실제 기기에서 실행:**
   - Android 기기를 USB로 연결하고 USB 디버깅을 활성화합니다
   - `npm run android` 실행 시 연결된 기기를 자동으로 감지합니다
   - 자세한 연결 방법은 아래 "실제 Android 기기 연결하여 실행하기" 섹션을 참고하세요

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Android 빌드 설정

### Android SDK 경로 설정

Android 빌드를 실행하기 전에 Android SDK 경로를 설정해야 합니다.

1. `mobile_app/android/local.properties` 파일을 생성합니다:

   ```bash
   cd mobile_app/android
   echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
   ```

   또는 macOS가 아닌 경우:

   ```bash
   echo "sdk.dir=/path/to/your/android/sdk" > local.properties
   ```

### AndroidManifest.xml 충돌 해결

`react-native-android-notification-listener` 라이브러리와의 충돌로 인해 빌드 오류가 발생할 수 있습니다.

**오류 메시지:**

```
Attribute application@allowBackup value=(true) from AndroidManifest.xml
is also present at [:react-native-android-notification-listener] AndroidManifest.xml value=(false).
Suggestion: add 'tools:replace="android:allowBackup"' to <application> element
```

**해결 방법:**

1. `mobile_app/android/app/src/main/AndroidManifest.xml` 파일을 엽니다.

2. `<application>` 태그에 `tools:replace="android:allowBackup"` 속성을 추가합니다:
   ```xml
   <application
     android:name=".MainApplication"
     android:label="@string/app_name"
     android:icon="@mipmap/ic_launcher"
     android:roundIcon="@mipmap/ic_launcher_round"
     android:allowBackup="true"
     android:theme="@style/AppTheme"
     android:supportsRtl="true"
     android:enableOnBackInvokedCallback="false"
     tools:replace="android:allowBackup">
   ```

**주의사항:**

- `/android` 폴더는 Expo가 자동 생성하는 폴더이므로 git에 커밋하지 않습니다.
- 각 개발자는 로컬에서 위 수정을 직접 적용해야 합니다.
- `expo prebuild`를 실행하면 파일이 덮어씌워질 수 있으므로, 필요시 다시 수정해야 합니다.

## Expo란?

이 프로젝트는 **Expo**를 사용합니다. Expo는 React Native 개발을 더 쉽게 만들어주는 프레임워크입니다.

**Expo를 사용하는 이유:**
- **파일 기반 라우팅**: `expo-router`를 사용하여 파일 구조로 자동 라우팅 설정
- **네이티브 모듈 접근**: Expo SDK를 통해 알림, 파일 시스템, 이미지 등 네이티브 기능을 쉽게 사용
- **개발 편의성**: 네이티브 코드 없이도 대부분의 기능 구현 가능
- **Development Build**: `expo run:android`로 커스텀 네이티브 모듈도 사용 가능 (Expo Go 제약 없음)

**백엔드 연동:**
- Expo는 백엔드 API 호출에 제약이 없습니다
- 일반 `fetch` 또는 `axios`를 사용하여 REST API 호출 가능
- WebSocket, GraphQL 등 모든 HTTP 통신 방식 지원

## Git에서 무시되는 파일 및 폴더

프로젝트의 `.gitignore` 파일에 의해 다음 파일/폴더들은 git에 커밋되지 않습니다:

### `node_modules/`

- **설명**: npm/yarn으로 설치된 모든 패키지 의존성이 저장되는 폴더
- **왜 무시하나요?**:
  - 용량이 매우 크고 (수백 MB ~ 수 GB)
  - `package.json`과 `package-lock.json`만 있으면 `npm install`로 재생성 가능
  - 플랫폼별로 다른 바이너리가 포함될 수 있음

### `.expo/`

- **설명**: Expo 개발 서버의 캐시 및 임시 파일이 저장되는 폴더
- **왜 무시하나요?**:
  - 개발 중 생성되는 임시 파일들
  - 각 개발자의 로컬 환경에 따라 다를 수 있음
  - `expo start` 실행 시 자동으로 재생성됨

### `dist/`

- **설명**: 빌드된 프로덕션 파일들이 저장되는 폴더
- **왜 무시하나요?**:
  - 소스 코드에서 자동 생성되는 파일들
  - 빌드 명령어로 언제든 재생성 가능
  - 용량이 크고 불필요한 중복

### `expo-env.d.ts`

- **설명**: Expo의 TypeScript 타입 정의 파일 (자동 생성)
- **왜 무시하나요?**:
  - Expo CLI가 자동으로 생성하는 파일
  - 프로젝트 설정에 따라 내용이 달라짐
  - `expo start` 또는 `expo prebuild` 실행 시 자동 생성됨

### `/android`

- **설명**: 네이티브 Android 프로젝트 폴더
- **왜 무시하나요?**:
  - Expo가 `expo prebuild` 또는 `expo run:android` 실행 시 자동 생성
  - `app.json` 설정에 따라 내용이 달라짐
  - 각 개발자의 로컬 환경(Android SDK 경로 등)에 따라 다를 수 있음
  - 수동 수정이 필요할 경우 (예: AndroidManifest.xml), 로컬에서만 수정

### `.vscode/`

- **설명**: Visual Studio Code 에디터의 워크스페이스 설정 폴더
- **왜 무시하나요?**:
  - 각 개발자의 개인적인 에디터 설정 (확장 프로그램, 디버깅 설정 등)
  - 팀 전체에 공유할 필요가 없는 개인 설정
  - 프로젝트 실행과 무관한 파일들

### 기타 무시되는 파일들

- `.env*.local`: 로컬 환경 변수 파일 (API 키, 비밀번호 등 민감한 정보)
- `*.log`: 로그 파일들
- `.DS_Store`: macOS 시스템 파일
- `build/`: 빌드 결과물 폴더

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
````
