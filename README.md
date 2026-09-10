# Window POS

플로우넷 사우디 - 설치형 윈도우 앱

## 🛠 기술 스택

- **Framework/Library**: React, Electron
- **Language**: TypeScript
- **State Management**: Redux Toolkit (Redux-persist)
- **Build Tool**: Vite

## ⚡ 시작하기

### 1. 필수 소프트웨어 ###

- **Node.js**: `v20.11.0` 이상
- **npm**: `v10.2.4` 이상
- **Git**: 소스 코드 형상관리.

### 2. 권장 도구

- **Editor**: [VS Code (Visual Studio Code)](https://code.visualstudio.com/)
  - TypeScript와 React 개발에 최적화된 도구입니다.
  - 다음 확장 프로그램(Extension) 설치를 권장합니다:
    - `ESLint`: 코드 품질 유지
    - `Prettier`: 코드 포맷팅 자동화
    - `TypeScript Vue Plugin` (혹은 React 전용 타입 힌트 도구)

## 📂 폴더 구조

```text
pos-window/
├── assets/             # 글로벌 이미지 및 폰트 파일 관리
├── bin/                # 빌드 및 타입 자동 생성 스크립트 관리
├── config/             # 프로젝트 전역 환경 설정 파일 관리
├── dist/               # 빌드 완료된 실행 파일(.exe) 관리
├── src/                # 프로그램 소스 코드
│   ├── main/           # 메인 프로세스
│   │   ├── common/     # 메인 프로세스 공통 유틸리티 관리
│   │   ├── config/     # 메인 프로세스용 설정 관리
│   │   ├── listener/   # IPC 이벤트 리스너 (Renderer와의 통신) 관리
│   │   ├── printer/    # 영수증/주문서 프린트처리 관리
│   │   ├── public/     # 정적 리소스 파일 관리
│   │   └── service/    # 서비스 관리
│   │   └── zatca/      # zatca 송장관련 처리
│   ├── preload/        # Preload 프로세스
│   └── renderer/       # Renderer 프로세스 - React 앱 (프론트엔드 UI)
│       ├── apis/       # API 및 IPC 통신처리 관리
│       ├── assets/     # 렌더러 이미지 및 폰트 파일 관리
│       ├── common/     # 공통 모듈 및 상수 관리
│       ├── components/ # 재사용 가능한 UI 단위 컴포넌트 관리
│       ├── mocks/      # 개발용 임시(Mock) 데이터 관리
│       ├── modals/     # 페이지별 팝업 및 모달 UI 관리
│       ├── pages/      # 라우팅 경로별 메인 페이지 관리
│       ├── providers/  # 공통 데이터 공급 관리
│       └── redux/      # 전역 상태 관리 (Store, Slice)
├── shared/             # 메인/프리로드/렌더러 공유정보 관리
└── types/              # 자동 생성된 TS 타입 정의 파일(.d.ts)
```

## 📦 빌드 & 배포

빌드 결과물은 프로젝트 루트의 `/dist` 폴더에 생성됩니다.
각 명령어는 용도에 맞게 선택하여 사용하세요.

### 🛠 빌드 명령어

| 명령어                 | 환경                                |
| :--------------------- | :---------------------------------- |
| `npm run compile:prod` | **런터임 - 운영(Production)**       |
| `npm run compile:stag` | **런터임 - 스테이(Staging)**       |
| `npm run compile:dev`  | **런타임 - 테스트(Development)**      |
| `npm run watch`        | **디버깅 - 개발(Devbug mode)** |

## 📦 Troubleshooting

- 빌드 환경 이슈
  - 32비트로 재설치

    ```text

    1) Node 22.22.1 (32bit) 기반으로 빌드 환경을 세팅
      -> nvm use 22.22.1 32

    2) 기존캐시 및 node_modules 삭제
      -> rm -rf node_modules package-lock.json

    3) npm 캐시 초기화
      -> npm cache clean --force

    4) 32비트 노드 환경에 맞춰서 패키지 재설치
      -> npm install

    5) Eletron 32비트 리빌드 실행
      -> npm run rebuild:32

    ```

## 📦 Release Note

> ### v1.0.0
>
> ---
>
> #### 배포: 테스트 (미정) / 운영 (미정)
>
> ```text
>  [신규]
>   1.최초배포
>
> ```
