# SlideFlow

SlideFlow는 Vite + React + TypeScript 기반의 슬라이드 에디터입니다.
이미지 슬라이드와 텍스트 레이어를 타임라인에서 함께 편집하고, Preview/녹화로 바로 결과를 확인할 수 있습니다.

> Note: 데스크톱 사용 환경에 최적화되어 있습니다.

## 주요 기능

- 이미지/텍스트 혼합 타임라인 편집
- 다중 트랙 타임라인에서 드래그로 시작 시간/트랙 이동
- 이미지/텍스트 duration 조절
- 캔버스에서 이미지/텍스트 드래그 이동
- 이미지 회전, 텍스트 회전/박스 폭 리사이즈 지원
- 텍스트는 항상 최상위 레이어(zIndex 999)로 렌더링
- 텍스트 빠른 등록: Library에서 텍스트 입력 후 `Create & Add` 시 즉시 타임라인 추가
- 텍스트 인라인 편집: 타임라인 텍스트 아이템 선택 후 텍스트 직접 수정
- Properties 패널에서 텍스트 상세 편집
  - text, position(x/y), fontSize, maxWidth, color, backgroundColor, align, rotation, duration
- 프로젝트 Import/Export(JSON)
- Preview/녹화 지원
  - 텍스트 포함 렌더
  - 캔버스 비율 기준으로 Preview/Fullscreen 표시

## 텍스트 레이어 워크플로우

1. 왼쪽 `Text` 섹션에 자막 문구 입력
2. `Create & Add` 클릭
3. 타임라인에서 텍스트 아이템 이동/길이 조절
4. 캔버스에서 위치 이동, 회전, 폭 조절
5. Properties에서 세부 값 정밀 편집
6. Preview/녹화로 결과 확인

## Preview / Fullscreen 동작

- Preview는 캔버스 비율(예: 16:9, 9:16, 1:1)을 유지해서 표시됩니다.
- Fullscreen에서도 동일 비율로 중앙 정렬된 상태로 표시됩니다.
- 텍스트/이미지 위치는 메인 캔버스 좌표계를 기준으로 렌더됩니다.

## 기술 스택

- React + Vite
- TypeScript
- @dnd-kit/core
- react-draggable
- react-icons
- CSS

## 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 빌드 검증

```bash
npm run build
```

## 최근 업데이트 요약

- 텍스트 레이어를 이미지와 동등한 편집 객체로 확장
- 텍스트 타임라인 드래그/길이 조절/인라인 텍스트 수정 지원
- 캔버스 텍스트 이동/회전/리사이즈 지원
- Preview/녹화 텍스트 렌더 개선 및 비율/위치 동기화 보정
- Preview fullscreen 비율 유지 및 중앙 정렬 개선
- UI를 아크릴 플레이어 무드로 리디자인
