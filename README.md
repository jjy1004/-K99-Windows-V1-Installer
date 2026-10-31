# K99 Windows EXE 자동 제작 — 비공개 저장소 전용

## 이번 수정본 업로드: 기존 4개 파일 교체

다운로드 ZIP 자체를 GitHub에 올리지 말고 압축을 풀어 **아래 네 경로의 파일을 같은 경로에 덮어쓴다**.
다른 프로젝트나 저장소에는 업로드하지 않는다. 이미 있는 `.gitignore`는 유지해도 된다.

1. `.github/workflows/windows-installer.yml`
2. `source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip`
3. `source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip.sha256`
4. `README.md`

GitHub 웹 화면에서 workflow는 기존 파일의 편집 버튼으로 교체하고,
source 폴더의 ZIP/sha256은 **Add file → Upload files**에서 함께 교체한다.
README는 루트 기존 파일을 교체한다. 숨김 `.github` 폴더를 빠뜨리지 않는다.
4개 모두 커밋한 뒤 Actions → Build K99 Windows Installer → Run workflow를
한 번 실행한다. 현재 브랜치를 선택하고 사용량·비용 확인란을 체크한다.
실제 저장소의 기존 4개 파일 경로는 이 환경에서 조회하지 않았으므로,
경로가 다르면 기존 파일명을 임의로 바꾸지 말고 위 경로를 기준으로 배치한다.

### 이번 수정본 확인 및 TS6305 원인

`lib/api-client-react/package.json`에는 `scripts.build`가 없다.
이 패키지에 `pnpm --filter ... run build`를 호출하면 선언 파일이 생성되지 않는다.
현재 로컬 workflow에는 이 잘못된 호출이 없었으며, 실제 원격 workflow는 조회하지 않았다.
따라서 원격 파일/브랜치가 이전 버전인지 여부를 단정하지 않는다.

이번 workflow의 라이브러리 단계 이름은
**Build and verify declarations directly with TypeScript (no package build script)**이다.
실행 로그에 **K99 DIRECT-TSC DECLARATIONS v1**, workflow commit, 소스 ZIP SHA-256이 표시되어야 한다.
이 문구 없이 기존 filtered `build` 오류가 나오면 해당 실행의 workflow 파일 및 선택 브랜치를 확인한다.
이전 실패 실행의 Re-run jobs 대신 **교체 커밋이 있는 브랜치에서 새 Run workflow**를 실행한다.

### TS6305 수정과 빌드 순서

`api-client-react`는 composite/emitDeclarationOnly 프로젝트이고 React 앱은 이를 참조한다.
`tsc -p ... --noEmit`은 참조 라이브러리를 자동 빌드하지 않으므로 깨끗한 checkout에서
`dist/index.d.ts`가 없으면 TS6305가 발생한다. React 기능 파일을 변경하거나
검사를 생략하지 않고, 다음 순서로 해결한다.

1. 잠금 파일 기준 의존성 설치(기존 Node/Python/VS 준비 설정 유지).
2. `node scripts/build-desktop-declarations.cjs`
   — 설치된 TypeScript CLI를 Node로 직접 실행하여 두 라이브러리를
   `--build --force --verbose`로 선언 파일 빌드한다. 패키지 `build` 스크립트와
   운영 DB 패키지는 호출하지 않는다. tsconfig와 생성된 `dist/index.d.ts`를 검사한다.
3. React `typecheck`, 로컬/모의 장비 테스트.
4. Electron 데스크톱 번들 → 별도 런타임 스테이징 → Windows x64 네이티브 재빌드
   (`npmRebuild:true`, `buildDependenciesFromSource:true`) → NSIS EXE.
5. 패키징된 better-sqlite3를 Electron Node 모드에서 로드하여 ABI 검사.
6. EXE 크기·PE 형식·SHA-256 검증 후에만 결과 Artifact 업로드.

직접 Windows에서 `desktop:dist`를 실행하는 경우에도 내부 라이브러리 빌드와
React 검사를 선행한다. 실패 시 Actions Summary에 실패 단계와 수정 대상이 표시되고,
패키징 단계별 로그 및 생성된 builder 진단 파일은 별도 실패 Artifact로 보관된다.
원래 TypeScript 오류의 파일·행·오류 코드는 해당 실패 단계 전체 로그에서 확인한다.

### 이번 수정의 실제 검증 범위

- Linux 임시 소스 사본에서 기존 선언 파일 및 빌드 캐시 없이 검사했다.
  의존성 패키지는 이미 설치된 로컬 패키지를 재사용했으며 Windows 신규 설치 검증은 아니다.
- 수정 전 `AdminPasswordPanel.tsx`, `DesktopStatusStrip.tsx`, `order-deletion.ts`에서
  TS6305 세 건을 재현했다.
- 위 내부 라이브러리 빌드 후 React 타입 검사 종료 코드 0을 확인했다.
- 설치 빌더 설정·순서·아이콘·바로가기·데이터 보존 정적 검사 9개를 통과했다.
- Windows x64 패키징, Electron SQLite ABI 실행, NSIS EXE 생성 및 크기·해시,
  Windows 11 실제 설치와 장비는 여기서 검증하지 않았다.
  이후 GitHub 실행이 성공하여 실제 산출물이 생긴 경우에만 EXE 생성 성공으로 판단한다.

## 현재 사실

이 문서와 workflow는 **자동 빌드 준비 파일**이다. 실제 GitHub 저장소 생성·업로드·Windows 빌드·EXE 확보 여부는 각각 별도로 보고한다.
workflow가 존재하거나 Linux 검사에 통과했다는 이유만으로 EXE 생성 성공이라고 보고하지 않는다.
최종 파일명은 `K99-Windows-V1-Setup-0.3.0-x64.exe`이다.

## 승인 및 비용 경계

- 소스 공개 금지. 전용 **Private** 저장소 `K99-Windows-V1-Installer`를 사용한다.
- 기존 매장 프로젝트·저장소·DB·배포·장치 도우미에는 접근하지 않는다.
- 준비 ZIP에는 정제된 소스 ZIP·SHA-256·workflow·설명서만 있다. 운영 DB, 실제 사진, 비밀키, 개발 미리보기 데이터, `.git` 이력은 없다.
- 계정 연결 승인과 저장소 생성/업로드 승인은 별개다. 후자는 승인받았더라도 GitHub API 접근이 확인되지 않으면 수행하지 않는다.
- 비공개 GitHub Actions의 실행 시간·산출물 저장은 계정별 무료 한도가 있고 초과 비용이 생길 수 있다.
- 이 workflow는 push/PR/스케줄로 실행되지 않는다. 수동 실행 시에도 `usage_approved` 확인을 켜야 하며 저장소가 Private이어야 Windows 작업을 할당한다.
- **남은 무료 실행량과 산출물 저장 용량 또는 별도 비용 승인을 확인하기 전에는 Run workflow를 누르지 않는다.** 체크박스 자체가 과금을 차단하는 장치는 아니다.
- 자동 결제나 유료 플랜 전환은 구성하지 않는다. 작업 최대 40분·동시 빌드 1개·산출물 보관 7일이며, 이전 실행을 반복하지 않는다.
- 공식 안내: https://docs.github.com/en/billing/managing-billing-for-your-products/about-billing-for-github-actions

## 저장소에 올릴 정확한 구성

`K99-Windows-V1-GitHub-Private-Repository.zip`을 압축 해제한 **내용물**을 전용 비공개 저장소 루트에 넣는다.
이 외의 작업 폴더 전체를 업로드하지 않는다.

```
.github/workflows/windows-installer.yml
source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip
source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip.sha256
README.md
```

소스 ZIP의 SHA-256을 검사한 뒤 Windows 2022 hosted runner에서 압축을 푼다.
pnpm 10.26.1, Node 24 x64, Python 3.12를 자동 준비한다.
Microsoft 제공 Windows 이미지의 VS2022 C++ x64 도구와 Windows SDK를 검사하며 누락 시 중단한다.
고정 잠금 파일 설치 → 타입/로컬 DB 검사 → React 빌드 → Electron ABI SQLite 재빌드 → NSIS 제작 순서다.
사용한 외부 Actions는 검토 시 확인한 전체 commit SHA로 고정했다.

## 명령어 없이 GitHub 웹 화면에서 진행하는 대안

GitHub 연동 API로 업로드할 수 없을 때만 사용한다. 비공개 저장소 생성 승인을 이미 받은 작업에 대한 웹 대안이다.

1. GitHub의 **New repository**에서 이름을 `K99-Windows-V1-Installer`로 정하고 **Private**를 확인한다. 같은 이름이 이미 있으면 사용/덮어쓰기하지 말고 중단한다.
2. 위 저장소 준비 ZIP을 PC에서 풀고 **Add file → Upload files**에서 `.github`, `source`, 설명서 등을 루트에 올린다. ZIP 하나만 저장소 루트에 올리는 것이 아니다.
3. 업로드 후 자동 실행되지 않는지 확인한다. Actions에 **Build K99 Windows Installer**가 보여야 한다.
4. 계정 Billing/Actions 사용량·저장 용량을 확인하고 승인한 후에만 **Run workflow**에서 확인란을 체크하여 실행한다.
5. 초록색 성공이면 실행 화면 **Artifacts → K99-Windows-V1-0.3.0-x64**를 다운로드한다. 비공개 다운로드에는 해당 GitHub 계정 접근 권한이 필요하다.

`skipped`는 빌드 성공이 아니다. 확인란이 꺼져 있거나 저장소가 Public이면 작업이 생략되고 EXE도 생성되지 않는다. 반드시 실제 artifact와 manifest를 확인한다.

## 실제 성공 판정과 전달

단순 컴파일 외에 다음을 검사한 경우에만 산출물을 업로드한다.

- `win-unpacked/K99-Windows-V1.exe`의 PE x64(AMD64) 헤더
- 패키징된 SQLite `.node`를 Electron의 Node 모드에서 실제 로드하여 ABI 확인
- 정확한 이름의 설치 EXE 존재, 1MB 이상, MZ/PE 헤더, 실제 SHA-256과 체크섬 파일 일치
- 파일명·bytes·SHA-256·Electron 버전·ABI를 `build-manifest.json`으로 기록

artifact에는 EXE·SHA-256·build-manifest.json·electron-abi-result.json만 포함한다.
GitHub의 artifact 다운로드는 ZIP이므로 한 번 압축을 푼 뒤 **EXE를 더블클릭**한다.
설치 후에는 PowerShell, 명령 프롬프트, Node/Python, 웹 브라우저 접속 없이 바로가기로 실행한다.
별도로 EXE 파일을 전달하는 경우에도 그 파일의 크기와 SHA-256을 위 manifest와 대조한다.

## 바로가기·아이콘·독립 설치

- 설치 창에서 바탕화면/시작 메뉴 바로가기 생성을 각각 선택한다.
- 표시 이름: **K99 스마트 접수 시스템**
- 시작 메뉴 위치: **K99-Windows-V1 → K99 스마트 접수 시스템**
- K99 글자·세탁물·체크 표시의 청록/금색 전용 ICO를 사용한다. 기존 명품 세탁비 프로그램을 재사용하지 않는다.
- 이미 같은 이름의 바로가기가 있으면 덮어쓰지 않고 안내한다. 기존 바로가기나 프로그램을 제거하지 않는다.
- 실행 파일과 앱 ID/사용자 데이터 경로는 기존 Windows V1과 동일하게 유지하여 데이터 보존한다.
- 실제 아이콘 표시·한글 바로가기·선택 해제·설치/제거는 Windows 현장 검증 전까지 미검증이다.

## 검증 구분

Windows Server hosted runner의 패키징/Node 검사 ≠ Windows 11 실제 설치 검사.
Electron Node 모드 ABI 검사 ≠ 앱 GUI 정상 실행 검사.
설치 EXE 생성 ≠ 서명된 안전한 배포본 ≠ 카메라/프린터/스캐너/듀얼 모니터 현장 통과.
현재 미서명 시험판이며 Windows 보안 경고/백신 검토와 `docs/windows11-acceptance.md` 검사는 별도로 필요하다.
