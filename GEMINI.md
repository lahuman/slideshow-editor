# 프로젝트명: 이미지 슬라이드쇼 에디터 (Vite + React + TypeScript)

---

## 개요

이미지를 업로드하여 타임라인 기반의 슬라이드쇼를 웹에서 편집하고 미리볼 수 있는 에디터입니다. 위치, 크기, 회전, 전환 효과 등 다양한 설정을 제공합니다.


## 주요 기능

- 이미지 업로드 (드래그앤드롭 및 파일 선택)
- 타임라인 기반 슬라이드 순서 및 재생 시간 설정 (드래그 앤 드롭으로 순서 변경 가능)
- 이미지별 위치, 크기, 회전 조절
- 전환 효과 및 전환 시간 설정
- 실시간 미리보기 지원
- JSON 형식으로 프로젝트 내보내기

---

## 기술 스택

- Vite
- React
- TypeScript
- React Icons
- react-draggable
- html2canvas
- @dnd-kit/core
- @dnd-kit/sortable

---

## 프로젝트 구조

```
src/
  components/
    ImageLibrary.tsx
    Timeline.tsx
    ImageCanvas.tsx
    ControlPanel.tsx
    PreviewModal.tsx
    DraggableItem.tsx
    SortableTimelineItem.tsx
  types/
    index.ts
  App.tsx
  App.css
  main.tsx
```

---

## 주요 컴포넌트 및 역할

- `App.tsx`: 전체 상태 관리, 주요 화면 배치 및 이벤트 핸들링
- `ImageLibrary.tsx`: 이미지 업로드 및 라이브러리 관리
- `Timeline.tsx`: 슬라이드 타임라인 편집 및 재생 헤드 표시
- `ImageCanvas.tsx`: 현재 슬라이드 이미지 위치 및 크기 조절 가능 화면
- `ControlPanel.tsx`: 선택된 슬라이드 속성 편집
- `PreviewModal.tsx`: 슬라이드쇼 미리보기 모달
- `types/index.ts`: 타입스크립트 인터페이스 및 타입 정의

---

## 사용 방법

1. 프로젝트 생성 및 의존성 설치
```bash
npm create vite@latest slideshow-editor --template react-ts
cd slideshow-editor
npm install react-icons react-draggable html2canvas @dnd-kit/core @dnd-kit/sortable
npm install @types/react-draggable --save-dev
```

2. 소스 코드 복사 및 붙여넣기

3. 개발 서버 실행
```bash
npm run dev
```

4. 웹 브라우저에서 `http://localhost:5173` 접속

---

## 실행 및 빌드

- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- 미리보기: `npm run preview`

---

## 작업 내역

- **React 18+ 호환성 확보**: `react-draggable` 라이브러리 사용 시 발생하는 `findDOMNode` 오류를 `nodeRef`를 사용하도록 수정하여 해결.
- **React Hooks 규칙 준수**: 잘못된 Hook 사용으로 인한 오류를 방지하기 위해 `ImageCanvas` 컴포넌트의 로직을 `DraggableItem` 자식 컴포넌트로 분리하여 리팩토링.
- **타임라인 기능 개선**:
  - 슬라이드 삭제 시, 후속 슬라이드들의 시작 시간이 자동으로 재계산되어 타임라인의 빈 공간이 생기지 않도록 버그 수정.
  - `@dnd-kit` 라이브러리를 도입하여 타임라인 아이템의 드래그 앤 드롭 순서 변경 기능 구현.
- **사용자 인터페이스(UI) 및 경험(UX) 개선**:
  - 타임라인 아이템의 드래그 동작(이미지 영역)과 선택 동작(그 외 영역)을 명확히 분리.
  - 타임라인에서 특정 슬라이드를 선택하면, 메인 캔버스에 해당 슬라이드가 표시되도록 연동.
  - 타임라인 아이템의 이미지 크기를 고정하고, 아이템 너비가 좁을 경우 파일명이 말줄임표(...)로 표시되도록 스타일 수정.

---

## 기타 사항

- 자동 저장 기능
- 추가 전환 효과와 이미지 필터 지원 예정
- 코드 품질: 타입스크립트 엄격모드 및 코드 린팅 적용