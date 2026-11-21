# K99 Laundry V2 2.4.6 — 최신 통합 소스·Windows 설치 빌더

## 이번 통합본

- 고객 특이사항·매장 맞춤 설정·알림 편집/모바일 수신·카메라별 화질 분기·스마트폰 연결 도우미를 포함합니다.
- 실제 빌드 입력은 `source/K99-Windows-V1-0.3.0-Windows-Build-Kit.zip`과 그 `.sha256`입니다. 루트에 남아 있는 과거 동명 ZIP은 사용하지 않습니다.
- 원본 영상의 별도 릴리스 연결, NSIS 검사, 고객 사진 조회 검사는 보존합니다. 소스 SHA-256 검사를 활성화하며 Windows 실행 승인이 있어야 빌드를 시작합니다.
- 검증된 EXE는 초안 업로드·크기 확인 후 정식 GitHub Release로 게시합니다. Artifact 저장 한도와 별개입니다.
- 최신 설치 파일: https://github.com/jjy1004/-K99-Windows-V1-Installer/releases/latest/download/K99-Smart-Laundry-V2-Setup.exe
- 최초 새 빌드 성공·릴리스 게시 전까지 위 `Setup.exe` 링크의 준비 완료를 보장하지 않습니다. 실제 매장 PC·카메라·프린터 검증과 CI 성공은 별개입니다.
- 별도 AI 처방 웹앱의 설치 버튼은 과거 `v2.4.5` 고정 주소를 위 최신 주소로 바꿔 재게시해야 합니다. 자세한 절차: `docs/windows-latest-installer-download.md`.
- `artifacts/api-server/src`의 다운로드 수정본은 Replit 웹 서버 재게시용입니다. Actions의 Windows EXE 빌드가 웹 서버를 자동으로 배포하지는 않습니다.

---

## 이전 소스 설명

기존 k99:// 사진 프로토콜을 재사용하여 일부 화면의 옛 도우미 주소/탭 세션 의존을 제거했습니다. 등록된 주문·의류의 사진만 Native IPC로 연결하며, 과거 절대 경로는 허용된 매장 사진 루트 안에서만 읽습니다. D 드라이브 전체 정적 서빙이나 webSecurity 해제는 없습니다.

케어라벨 사진의 img onLoad → Native IPC → 원본 Base64/MIME → 중앙 /api/carelabel/analyze → 소재 배지·태그 데이터 연결을 구현했습니다. 일반 전체사진/완료사진은 자동 분석하지 않습니다. 재렌더링·탭 왕복의 중복 분석과 태그 중복 출력은 방지합니다.

TypeScript/React desktop 빌드 및 자동검사 200개 통과. 임시 실제 SQLite·사진 파일·루프백 업로드를 사용했고 AI/프린터는 시험 어댑터입니다. 실제 Windows D 드라이브·Electron 프로토콜 엔진·실물 프린터는 미검증입니다. 중앙 모델의 기존 HTTP 200 검증과 이번 로컬 사진 검증을 혼동하지 않습니다.

이 ZIP은 최신 전체 Windows 빌드 소스입니다. 기존 설치 EXE에 자동 반영되지 않으며 GitHub Windows 빌드 후 업데이트해야 합니다. EXE/app.asar 파일이 아닙니다. 고객 DB·사진·키 값은 포함하지 않습니다.

상세: docs/windows-local-photo-loading.md

GitHub 교체: 기존 비공개 저장소의 .github/workflows · source · README.md 동명 파일을 교체하고 Run workflow를 실행합니다. 기존 영상 조각은 유지하세요. 매장 resources 폴더에 이 ZIP을 그대로 덮어쓰지 마세요. 설치 전 DB/사진 백업과 현장 검증을 수행하세요.
