# K99 V2 자동 소재 태그 — GitHub 업로드

1. 이 ZIP을 PC 임시 폴더에 풉니다.
2. 기존 비공개 저장소 main의 .github/workflows/windows-installer.yml과 source 폴더의 동명 소스 ZIP·sha256·upload.json을 교체합니다.
3. 기존 영상 조각 part001/part002 등은 삭제하거나 다시 업로드하지 않습니다. customer-videos.upload.json도 기존 내용과 같습니다.
4. Actions의 기존 Windows installer workflow에서 Run workflow를 실행하고, 성공한 실행의 Artifacts에서 설치본을 받습니다.

이 ZIP은 Windows 빌드용 소스이며 EXE/app.asar 완성본이 아닙니다. 매장 운영본에 바로 덮어쓰지 마세요. 실제 Gemini 호출·Windows 설치·TSC 실물 출력은 미검증입니다.
자동검사 182개·타입 검사·React desktop 빌드 통과. 조건부 자동 발행 및 오류/재시작 중복 방지 상세는 소스 안 docs/windows-automatic-material-tags.md에 있습니다.
API 키는 매장 Windows GEMINI_API_KEY에만 설정하며 GitHub/소스에 업로드하지 않습니다.
