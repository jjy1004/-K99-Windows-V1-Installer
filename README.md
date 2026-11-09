# K99 V2 — 로컬 사진 로드·케어라벨 연계 수정본

기존 k99:// 사진 프로토콜을 재사용하여 일부 화면의 옛 도우미 주소/탭 세션 의존을 제거했습니다. 등록된 주문·의류의 사진만 Native IPC로 연결하며, 과거 절대 경로는 허용된 매장 사진 루트 안에서만 읽습니다. D 드라이브 전체 정적 서빙이나 webSecurity 해제는 없습니다.

케어라벨 사진의 img onLoad → Native IPC → 원본 Base64/MIME → 중앙 /api/carelabel/analyze → 소재 배지·태그 데이터 연결을 구현했습니다. 일반 전체사진/완료사진은 자동 분석하지 않습니다. 재렌더링·탭 왕복의 중복 분석과 태그 중복 출력은 방지합니다.

TypeScript/React desktop 빌드 및 자동검사 200개 통과. 임시 실제 SQLite·사진 파일·루프백 업로드를 사용했고 AI/프린터는 시험 어댑터입니다. 실제 Windows D 드라이브·Electron 프로토콜 엔진·실물 프린터는 미검증입니다. 중앙 모델의 기존 HTTP 200 검증과 이번 로컬 사진 검증을 혼동하지 않습니다.

이 ZIP은 최신 전체 Windows 빌드 소스입니다. 기존 설치 EXE에 자동 반영되지 않으며 GitHub Windows 빌드 후 업데이트해야 합니다. EXE/app.asar 파일이 아닙니다. 고객 DB·사진·키 값은 포함하지 않습니다.

상세: docs/windows-local-photo-loading.md

GitHub 교체: 기존 비공개 저장소의 .github/workflows · source · README.md 동명 파일을 교체하고 Run workflow를 실행합니다. 기존 영상 조각은 유지하세요. 매장 resources 폴더에 이 ZIP을 그대로 덮어쓰지 마세요. 설치 전 DB/사진 백업과 현장 검증을 수행하세요.
