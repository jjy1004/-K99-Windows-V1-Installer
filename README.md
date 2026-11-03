## 최신 수정: 안내 영상 1회 재생 / 대기 영상 무한 반복

- process/value/water/sneakers: loop 없음, onEnded 또는 닫기로 대기 루프 복귀.
- 대기 promo/value: 자동·음소거·무한 반복. 대기/안내 플레이어 DOM 분리.
- TypeScript 검사, desktop:build, 자동 테스트 25개 통과. 실제 Windows EXE 및 장비 재검증은 미수행.
- 기존 비공개 GitHub 저장소에 동일 경로로 덮어쓰기. source 내부 ZIP은 압축을 풀지 않습니다.
- 기존 원본 영상 분할 파일은 변경하지 않았으며 이 소스 ZIP에 포함하지 않았습니다. 저장소의 기존 영상 파일을 유지하세요.
- 운영 DB, 고객 사진, 비밀키, node_modules, EXE는 포함하지 않습니다.

---

# 최신 통합 수정: 출고·한글 자동 조합·18초 대기 영상

이번 소스는 출고 카드의 출고 버튼 또는 하단 단일 검색창 Enter로 출고합니다. 단순 조회/입력 중에는 출고하지 않으며 중복 조회는 직원이 주문을 선택합니다.
고객명과 이름 검색은 영문 키를 두벌식 한글로 자동 조합합니다. 전화번호/주문번호/바코드는 보호하며 네이티브 한글 조합 중 Enter는 출고하지 않습니다.
고객 화면 대기 시 18.018초 기존 원본 영상을 `promo.mp4`로 무한 반복합니다. 안내 4종 종료/닫기 후 대기 영상으로 복귀하고, 새 접수 품목이 표시되면 영수증으로 전환합니다.
기존 영상 업로드 묶음은 그대로 사용합니다. 별도 promo로 교체하려면 빌드 소스의 `artifacts/k99-windows/media/videos/promo.mp4`에 배치합니다.
로컬 영상 교체 시 과거 manifest 해시 불일치는 차단 대신 경고/재계산합니다. 다운로드 조각 무결성·허용 경로·MP4 헤더 검사는 유지합니다.
이 ZIP은 Windows EXE가 아니라 기존 비공개 저장소에 교체할 빌드 소스입니다. 실제 Windows 설치/스캐너/IME는 현장 검증이 필요합니다.

---

# K99-Windows-V1 0.3.0 — 현장 기능 및 정식 영상 통합본

## 통합 UI·현장 업무 개선

- 신규 검수 입력은 물세탁·이상 없음·실물 확인함으로 시작합니다. 기존에 지정된 드라이세탁 방법과 저장된 검수 이력은 덮어쓰지 않으며, 직원이 기본값을 변경할 수 있습니다. 고객 동의는 여전히 자동 선택하지 않습니다.
- 모든 입력란·텍스트 영역에 `lang="ko"`와 `ime-mode: active` 힌트를 적용합니다. Chromium에서는 `ime-mode`를 지원하지 않으므로 Windows 한/영 모드를 강제로 바꾸는 기능은 아닙니다. 실제 한글 조합과 스캐너 입력은 Windows 현장에서 확인해야 합니다.
- 공식 고객 안내 3종은 공통 템플릿으로 연결됩니다. 고객명·품목·추가금이 치환되며 기존에 저장된 개별 문안·동의 이력은 유지합니다. 금액이 미입력이면 `00,000원` 예시가 표시됩니다.
- 완료 검수는 전후 비교 이미지·완성 사진·추가 바코드 스캔 없이 개별 또는 전체 확정합니다. 실제 세탁 미완료·취소·보류·이미 인도된 주문은 계속 차단하며, 전체 완료는 한 번의 저장으로 출고 대기까지 반영됩니다.
- 출고 대기 카드 목록이 상단에 표시되며, 하단 단일 입력란에서 연락처 끝 4자리 또는 바코드로 선택할 수 있습니다. 물품 인도는 직원의 별도 확정 버튼으로만 저장하고, 무스캔 인도는 직원 확인 이력으로 구분합니다. 배달 출고는 배달 중까지만 변경합니다.
- 미수거 안내는 한국 날짜 기준 세탁 완료일이 0일, 이후 +9일·+13일입니다. 기존 접수일 기준 보관료와 별개입니다. 문안 복사는 실제 발송으로 기록하지 않습니다.
- 자동 검사: `node scripts/test-desktop-field-ui.cjs` (GitHub Windows 워크플로에서도 실행). 브라우저 검사는 임시 SQLite·모의 IPC/장비이며 매장 데이터는 사용하지 않습니다.

## 추가 반영: 이벤트 배너와 영상 창 활성화

- 고객 영수증 우측 고지 박스에 혜택 배너(10만 원 10%, 20만 원 15%, 5만 원 이상 영수증 리뷰 5,000원)를 표시하고 기존 고지는 하단에 유지합니다. **표시 전용이며 자동 할인 계산·기존 결제 금액은 변경하지 않습니다.**
- 기존 보안 IPC `customer-action`의 `type: video`를 통해 네 영상 모두 최소화 복원 → 표시 → `screen-saver` 최상단 → 전체화면 → 포커스를 적용합니다. 별도 통신 경로는 추가하지 않습니다.
- 동일 명령의 종료·재생 오류, 직원의 영수증 복귀·창 닫기, 새 고객 전환, 렌더러 재로드·중단 시 최상단 고정을 해제합니다. 정상 종료 후 영수증 전체화면은 유지됩니다. 이전 영상의 지연 이벤트는 새 영상의 최상단 상태를 바꾸지 않습니다.
- 실제 Windows에서 다른 앱 뒤에 가리기·최소화 후 네 버튼 각각 실행, 종료 후 전체화면 영수증 복귀 및 최상단 해제, 모니터 분리·재연결을 확인해야 합니다. Windows 보안 화면/UAC보다 우선 표시되는 것은 보장하지 않습니다.

## GitHub 교체 방법

다운로드는 **소스 ZIP 1개 + 영상 ZIP 2개**입니다. 원본을 포함한 전체 자료가 첨부 파일 크기 한도를 넘으므로 전달 파일만 분리했습니다.
`Source-Upload.zip`, `Videos-1-of-2.zip`, `Videos-2-of-2.zip`을 모두 **같은 폴더에 압축 해제**하세요.
각 ZIP 안의 `source` 폴더를 통합하면 아래 전체 구성이 됩니다. 영상 ZIP 두 개를 저장소에 ZIP 그대로 올리지는 마세요.
소스 ZIP 안에 들어 있는 `source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip`은 해제하지 않고 그대로 업로드합니다.

1. 기존 **비공개 Windows 빌더 저장소**에서 `.github/workflows/windows-installer.yml`을 같은 경로의 새 파일로 교체합니다.
2. `source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip`과 `.zip.sha256`을 교체합니다.
3. 이번에 처음 제공하는 `source/customer-videos.zip.part001`부터 `part007`까지 **7개 모두** 및 `source/customer-videos.upload.json`을 그대로 추가합니다.
4. `README.md`를 교체하고 변경을 저장합니다. Actions에서 Windows installer workflow의 **Run workflow**를 실행합니다.
5. 성공한 실행의 Artifacts에서 설치 프로그램, SHA-256 및 빌드 진단 결과를 다운로드합니다.

영상 원본 합계는 145,456,480바이트입니다. 단일 대용량 파일을 GitHub에 올리지 않도록 20MiB 이하로 분할했습니다.
분할은 화질 변경이 아닌 ZIP 바이트 분할입니다. Windows Actions가 각 조각과 조합 결과의 SHA-256을 검증한 후 자동 해제합니다.
영상 변경이 없다면 다음 코드 수정 때 영상 조각 7개를 다시 올릴 필요가 없습니다.
`source` 아래 파일 이름을 변경하거나 조각을 누락하지 마세요. 별도의 외부 영상 서비스나 공개 저장소를 사용하지 않습니다.

예상 최종 설치 파일: **K99-Windows-V1-Setup-0.3.0-x64.exe**.
이 다운로드 자료는 설치 EXE 자체가 아닙니다. Linux 개발 환경의 검사만으로 Windows 빌드·설치 성공을 보증하지 않습니다.

## 정식 영상

| 고객 화면 버튼 | 패키징 파일 | 업로드 원본 | 해상도 / 길이 |
|---|---|---|---|
| 세탁 가격 안내 | value.mp4 | 세탁가격안내.mp4 | 1920×1080 / 약 18초 |
| 세탁 안내 | process.mp4 | 세탁안내.mp4 | 1920×1080 / 약 41초 |
| 드라이세탁 안내 | water.mp4 | 드라이세탁안내.mp4 | 1920×1080 / 약 49초 |
| 프리미엄 운동화 | sneakers.mp4 | 03_운동화.mp4 | 1920×1080 / 약 11초 |

모두 H.264/AAC 원본입니다. `resources/videos`에 포함하고 로컬 범위 요청을 지원합니다.
테스트용 영상 생성·판별 코드는 제거했습니다. 실제 프레임 재생 후 연결 상태를 보고하며 종료 시 실시간 접수 화면으로 돌아갑니다.
창이 열렸다는 사실만으로 연결·재생 성공을 표시하지 않습니다.

## 업무 변경

- 접수 화면에서 품목별 연속 촬영, 미리보기 유지, 마지막 사진과 누적 컷 수 표시.
- 최초 사진 1회 자동 태그 요청. 이후 사진 촬영은 태그를 추가 발행하지 않습니다. 의도한 재출력은 기존 별도 이력/사유 절차를 유지합니다.
- 미확정 사진은 SQLite 임시 촬영 원장으로 보존합니다. 가짜 확정 주문은 만들지 않습니다.
  최종 접수 저장 트랜잭션 안에서 실제 의류·사진·태그에 연결합니다. 연결 누락이면 주문 저장 전체가 취소됩니다.
- 품목 변경으로 원래 의류와 맞지 않는 사진은 다른 의류로 자동 이전하지 않습니다.
  해당 행을 새로 추가하도록 안내하며 기존 사진은 임시 원장·백업·사진 폴더에 보존합니다.
- F12/Space 글로벌 촬영은 카메라 미리보기가 켜져 있고 의류가 선택된 동안만 활성화합니다.
  Space는 다른 프로그램에서의 공백 입력도 소비할 수 있으므로 기본값 F12를 권장합니다.
- 접수 최종 총액을 직원이 수정할 수 있으며, 확정 주문·고객 화면·매출 집계에 반영합니다.
  원래 계산 금액과 수정 금액을 구분합니다. 대시보드는 확정 금액 기준으로, 별도 수납일 입금 장부와 구분합니다.
- 뒤로/앞으로 이동 시 접수 정보와 사진을 보존합니다. 일반 방문 접수는 주소가 선택 사항이며 연락처 끝 4자리도 허용합니다.
  수거·배송을 신청하면 주소가 필요합니다.
- 접수 / 세탁 전 / 세탁 후 / 완료 검수 화면을 직접 이동할 수 있습니다.
  탭 조회와 실제 공정 완료는 구분하며 “다음 단계”에서 실제 상태 변경이 실패하면 진행한 것으로 저장하지 않습니다.
- 개별 확인이 필요한 품목은 새 검수 화면 안에서 실제 세탁 방법·품목 상태·확인 여부를 입력합니다.
- 면책 / 추가 기술료 / 통합 안내의 문안을 수정·복사·저장합니다.
  동의는 사전 선택되지 않은 단일 동의 완료/미동의 기록이며, 직원 확인 기록이지 고객 전자서명이나 실제 문자 발송 증명은 아닙니다.
- 추가 기술료는 명시적인 동의 완료 이후만 확정 금액에 반영합니다.
  재저장은 중복 가산하지 않고 기존 안내 추가금액을 교체하며, 기존 기본 금액과 변경 이력을 보존합니다.
- 검색은 고객 이름·연락처 끝 4자리·바코드로 통합합니다. 고객 주문 요약 및 사진 폴더 열기를 제공합니다.
- 세탁 전후 비교 이미지를 생성하여 원본 사진과 별도로 같은 주문에 저장합니다.
  취소 주문을 제외한 운영 대시보드 8개 항목을 제공합니다.

## 저장·백업·운영 격리

- SQLite와 정본 사진은 설치 폴더가 아닌 기존 사용자 데이터 폴더에 보존합니다.
- 추가 사진 내보내기 기본 경로는 `D:\K99-Laundry\날짜_고객명_연락처끝4자리\접수사진` 또는 `세탁전후`입니다.
  저장 위치는 장비 설정에서 변경할 수 있습니다. D 드라이브가 없거나 저장 실패 시 다른 드라이브에 몰래 저장하고 성공 처리하지 않습니다.
- 새 고객과 주문만 사용하며 과거 Replit 데이터는 가져오지 않습니다.
  원래 운영 프로젝트·DB·배포·사진 도우미·태그 도우미에 연결하거나 파일을 변경하지 않습니다.
- 통합 암호화 백업에 확정 주문, 고객, 가격표, 관리자 설정, 사진·태그 이력 및 **미확정 촬영 사진**을 포함합니다.
- 자동 백업, 무결성 검사, 복구 전 안전 백업 및 복구 실패 원상복구 정책은 유지합니다.
- 복구된 정본 사진에서 고객별 D 드라이브 사진 사본을 다시 만들 수 있습니다.
  사진 폴더를 열 때 누락 사본을 복원하며, 이 과정은 새 주문·사진 이력·태그 출력을 만들지 않습니다.
- 업데이트·재설치는 앱 파일만 교체합니다. 같은 사용자 데이터 위치·앱 식별자를 유지하고 원본 자료를 자동 삭제하지 않습니다.
  시험 업데이트 전에는 외부 장치에 검증된 통합 백업과 복구 키를 별도로 보관하세요.

## 검증 범위 및 Windows 현장 검사

개발 환경 검사는 임시 SQLite, 모의 프린터/디스플레이 및 Chromium을 사용합니다.
GitHub Windows 빌드, 실제 NSIS 설치, TSC 실물 인쇄, USB 발판과 스캐너,
실제 듀얼 모니터·OBS 장치 검증은 별도입니다.

현장에서 확인할 항목:

1. EXE 설치·바탕화면/시작 메뉴 바로가기·앱 아이콘·자동 실행 선택.
2. 기존 사용자 자료 유지, 업데이트·재설치 및 안전 백업/복구.
3. 실제 D 드라이브 공간·쓰기 권한, 12장 이상 연속 촬영, 재시작 후 사진/태그 연결.
4. 실제 TSC 드라이버·용지 규격·인쇄 배율·바코드 선명도 및 스캐너로 동일 의류 재조회.
5. 첫 사진만 1회 출력, 중단/오류 시 실물 확인 없이 불확실 출력을 자동 재시도하지 않는지.
6. 웹캠/OBS 전환, 앱 비활성 상태에서 F12 또는 Space 발판 입력, 촬영 종료 후 키 해제.
7. LG 고객 모니터 선택·전체 화면 좌표·탭 왕복·재부팅·모니터 분리/재연결.
8. 네 영상의 첫 프레임·소리·마지막까지 재생·닫기·실시간 접수 화면 복귀.
9. 총액 수정·추가 기술료 동의·미동의·대시보드 금액·공정 이동 및 전후 사진.
10. 외부 백업 매체에서 복구하고 주문·사진·태그·설정 및 D 폴더 사본까지 확인.


---

# K99 Windows EXE 자동 제작 — 비공개 저장소 전용

## 최종 패키징 단계 수정 및 확인 한계

GitHub의 실제 마지막 실패 로그는 아직 제공되지 않았고 연결 API도 사용 가능하지 않아,
이번 GitHub 실패의 직접 원인이 무엇인지 확정하지 않는다.
`ERR_PNPM_RECURSIVE_RUN_FIRST_FAIL`만으로 네이티브 컴파일/NSIS/경로 중 하나를 단정하지 않는다.

다만 기존 사용자 정의 NSIS 헤더에서 다음 컴파일 결함을 실제로 재현했다.

`!insertmacro: macro named "MUI_HEADER_TEXT" not found!`

electron-builder 26.8.1은 사용자 정의 헤더를 자신의 MUI2 포함보다 먼저 읽는다.
헤더 함수에서 MUI 매크로를 먼저 사용하고 있었으므로 `MUI2.nsh`를 명시적으로 먼저 포함했다.
설치 UI 함수·변수는 `BUILD_UNINSTALLER`가 아닌 컴파일에서만 정의하도록 분리했다.
바로가기 선택, 설치/제거 동작 및 사용자 데이터 보존 정책 자체는 유지했다.

- 실제 builder가 사용하는 NSIS 컴파일러로 설치/제거 **모의 헤더**를 각각 컴파일한다.
  경고도 오류로 처리한다. 이 검사는 전체 K99 설치본 제작/실행과 다르다.
- Actions는 기존 선언 파일·React·저장소/모의 장비 검사를 그대로 실행하고,
  전체 패키징 전에 NSIS 헤더 컴파일 검사를 추가한다.
- 최종 electron-builder는 설치된 CLI를 Node로 직접 실행한다.
  원본 stdout/stderr를 실시간 표시하고 `packaging-console.log`에도 보존한다.
  실패 시 `K99-builder-diagnostics` Artifact에서 단계별 로그와 원본 오류를 받는다.
- `npmRebuild:true`, `buildDependenciesFromSource:true`와 잠금 파일의 Electron 버전은 유지한다.
  ABI 검사는 개발용 Electron이 아닌 실제 `win-unpacked/K99-Windows-V1.exe`를 Node 모드로
  실행해 SQLite 바인딩을 로드하며 Electron 버전도 대조한다. GUI/장비를 실행하는 검사는 아니다.
- 출력 경로는 `generated-artifacts/windows-installer`이며 기존 앱 ID,
  `%LOCALAPPDATA%\K99WindowsV1`, 관리자 설정·DB 구조는 변경하지 않는다.
- **Windows x64 전체 빌드, K99 EXE 생성·크기·SHA-256, Windows 11 실제 설치는 미검증이다.**
  NSIS 모의 검사에서 생성하는 `*-probe-only.exe`는 K99 설치본이 아니며 배포하지 않는다.

이번 수정의 Linux 검증: NSIS 설치/제거 모의 헤더 컴파일 각각 통과,
빌더·입력 경로·원본 오류 보존 검사 21개 통과.
정제된 ZIP에는 모의 EXE, 실제 DB/사진/설정, 다운로드한 NSIS 도구를 포함하지 않는다.
한 번의 새 Actions 실행으로 검증 절차를 이어가도록 구성했지만
원본 GitHub 로그 없이 모든 Windows 패키징 문제가 해결되었다고 보장하지 않는다.

## Windows 입력 경로 검사 수정

이 수정본은 `src/index.ts is missing from tsconfig inputs` 오판을 수정한다.
TypeScript는 Windows에서도 입력 경로에 `/`를 사용하지만 기존 검사는
`path.join`이 만드는 `\` 경로와 문자열을 그대로 비교했다.
실제 `parseJsonConfigFileContent`로 이 불일치를 재현하고 양쪽의 절대 경로를
같은 구분자·Windows 대소문자 규칙으로 정규화한 뒤 전체 경로를 비교하도록 수정했다.
다른 프로젝트의 `index.ts`나 누락 파일을 통과시키는 부분 경로 검사는 사용하지 않는다.

두 라이브러리의 tsconfig는 `extends: ../../tsconfig.base.json`, `include: ["src"]`,
`composite: true`, `emitDeclarationOnly: true`, `rootDir: src`, `outDir: dist`이며
별도 `files`·`exclude`·프로젝트 참조가 없다. 실제 파싱 결과에 진입 파일이 포함되어
있으므로 tsconfig와 앱 기능은 변경하지 않는다.

수정본 로그 식별 문구: **K99 DIRECT-TSC WINDOWS-PATH-FIX**.
자동 실행 순서: 의존성 설치 → Windows 입력 경로 회귀 테스트 →
두 라이브러리의 입력 검사·강제 선언 빌드·출력 파일 검사 → React 검사 →
기존 Electron/NSIS 제작·ABI 검사·EXE SHA-256 검사 → Artifacts.
테스트는 Windows hosted runner에서도 실제 두 tsconfig를 파싱하며,
가상 Windows 경로 사례로 이전 비교의 실패와 수정 비교의 성공을 대조한다.

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
실행 로그에 **K99 DIRECT-TSC WINDOWS-PATH-FIX**, workflow commit, 소스 ZIP SHA-256이 표시되어야 한다.
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
- 설치 빌더 설정·순서·아이콘·바로가기·데이터 보존 정적 검사 11개를 통과했다.
- 입력 검사 회귀 테스트 7개를 통과했다. 실제 두 tsconfig 파싱, 가상 Windows 경로에서
  구형 비교 실패/수정 비교 성공, 대소문자·UNC·한글/공백·다른 드라이브·누락·제외 파일을 검사한다.
- `--verify-only`는 선언 파일 생성 전 실패하고 생성 후 성공함을 확인했다.
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
