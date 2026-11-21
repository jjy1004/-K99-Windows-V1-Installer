# 최신 Windows 설치 파일과 웹 설치 버튼

## 정식 최신 설치 파일

`https://github.com/jjy1004/-K99-Windows-V1-Installer/releases/latest/download/K99-Smart-Laundry-V2-Setup.exe`

체크섬은 위 주소 뒤에 `.sha256`을 붙입니다. 빌드가 성공하고 정식 릴리스가 게시된 뒤에만 파일이 존재합니다.

Windows 빌드는 명시적 실행 승인 후 시작합니다. SQLite Electron ABI와 EXE 크기·SHA-256을 검사한 뒤 초안 릴리스에 업로드합니다. 첨부파일 상태·크기와 제공되는 GitHub SHA-256을 확인한 뒤 최신 정식 릴리스로 공개합니다. 이전 소스의 빌드는 현재 main보다 오래됐으면 최신 릴리스를 덮어쓰지 않습니다. 영상 보관용 릴리스는 최신 설치 릴리스로 바꾸지 않습니다.

기존 요청명 `K99-Smart-Laundry-V2-Setup.2.exe`는 Actions의 보조 산출물로 유지하며, 정식 설치 버튼은 위의 `Setup.exe`를 사용합니다. Actions Artifact 용량 초과는 별도 GitHub Release 다운로드를 차단하지 않습니다.

## 이 프로젝트의 기존 다운로드 주소

`https://k-99-windows-v-1.replit.app/api/dev-downloads/K99-Smart-Laundry-V2-Setup.exe`

`installerChannel: github-latest` 설정은 이 주소와 체크섬 주소를 GitHub 최신 정식 릴리스로 302 연결합니다. 오래된 체크섬·파일 크기 응답을 재사용하지 않으며 리디렉션을 캐시하지 않습니다. 기존 보관용 포터블 ZIP의 App Storage 스트리밍 보호는 유지합니다.

이 변경은 Replit에서 재게시해야 정식 도메인에 반영됩니다. 로컬 코드 수정·GitHub 푸시·Windows 빌드·Replit 재게시를 구분해야 합니다. 기존 JSON의 App Storage 버전·크기·해시는 과거 보관 파일 정보이며 GitHub 최신 EXE의 검증 정보로 표시하지 않습니다. 최신 검증 정보는 해당 GitHub 릴리스의 `installer-release.json`과 `build-manifest.json`에 있습니다.

## 별도 AI 처방 웹앱의 설치 버튼

2026-11-21 확인한 `https://k-99-washcare-ai.replit.app` 공개 화면은 `v2.4.5/…Setup.2.exe`를 고정 주소로 사용했습니다.

해당 웹앱 프로젝트에서 설치 버튼의 기본 주소와 배포 설정 주소를 **모두 위의 `/releases/latest/download/…Setup.exe` 주소로 교체하고 재게시**해야 합니다. 다운로드 파일명 속성도 `K99-Smart-Laundry-V2-Setup.exe`로 맞춥니다.

이 저장소의 변경만으로 다른 Replit 프로젝트의 배포된 JavaScript가 수정되지는 않습니다. 과거 `v2.4.5` 첨부파일을 최신 파일로 바꿔치기하지 않습니다.

실제 매장 PC 설치, 카메라·발판·프린터·카카오톡 동작 검증은 CI 빌드 검증과 별도입니다.
