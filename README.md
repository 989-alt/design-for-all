# design-for-all — 모두의 교실 디자인 스튜디오

미술 5학년 10단원 「모두를 위해」 — 제품·유니버설 디자인을 조립하고 테스트하는 게임형 웹앱.

- 대상·차시: 초등 5학년 미술, 4~6차시 「제품 디자인 전람회 열기」의 디자인 활동 대체

## 바로 해 보기

https://989-alt.github.io/design-for-all/ (교사 안내: 주소 끝에 `?teacher=1`)

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 생성 — dist/index.html 을 파일로 열어도 동작
npm test         # 단위 테스트
npx playwright test   # e2e
```

## 교사 안내

주소 끝에 `?teacher=1` 을 붙이면 교사 안내 화면이 열린다.

## 저장

localStorage 1키만 쓴다. 개인정보 수집 없음, 네트워크 호출 없음.

## 에셋 출처

- 이미지: GPT-6.1-sol 생성
- 배경음: Suno, 효과음: ElevenLabs (kie.ai 경유)

## 문서

`docs/` 에 PRD·PRODUCT·DESIGN·교과분석·에셋목록·tokens.json 사본이 있다. 정본은 하네스 `docs/design-for-all` 이며 `node scripts/sync-docs.mjs` 로 갱신한다.

## 라이선스

미정.
