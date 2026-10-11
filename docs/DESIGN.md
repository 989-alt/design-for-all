<!-- 정본은 하네스 docs/design-for-all — 이 사본은 저장소 배포용 -->
---
name: 모두의 교실 디자인 스튜디오
description: 초등 5학년 미술 유니버설 디자인 게임 — 환한 작업실의 두꺼운 종이 타일, 굵은 남색 윤곽의 카툰 플랫, Sol 생성 패널·버튼·아이콘·초상 UI 킷
colors:
  background: "#FFF8EC"
  foreground: "#1B2A41"
  card: "#FFFFFF"
  primary: "#1F6F8B"
  secondary: "#FFE3B3"
  muted: "#F1EADB"
  muted-foreground: "#4B5565"
  accent: "#C8441B"
  accent-text: "#B33A12"
  destructive: "#B3261E"
  border: "#1B2A41"
  surface-classroom: "#DCEFF5"
  surface-studio: "#F7EFE0"
  surface-slot: "#F1EADB"
  surface-progress: "#E6DCC8"
  cardkind-trouble: "#FFD6CC"
  cardkind-trouble-foreground: "#5A1F10"
  cardkind-case: "#D7ECF7"
  cardkind-ref: "#E3F2D9"
  reaction-happy: "#2E7D4F"
  reaction-partial: "#9A5B00"
  reaction-unhappy: "#B3261E"
  element-purpose: "#1F6F8B"
  element-tech: "#5B4BB5"
  element-function: "#B26A00"
  element-beauty: "#C2185B"
  element-access: "#E4572E"
  element-eco: "#2E7D4F"
typography:
  display:
    fontFamily: "Jua, sans-serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Jua, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "20px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "Noto Sans KR, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1
  number:
    fontFamily: "Jua, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1
rounded:
  sm: "8px"
  md: "14px"
  lg: "22px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.title}"
    height: "64px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    typography: "{typography.title}"
    height: "64px"
  button-paper:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.foreground}"
    typography: "{typography.title}"
    height: "56px"
  tool-button:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    size: "48px"
  hud-bar:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    height: "72px"
  panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    padding: "16px 20px"
  speech-panel:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    typography: "{typography.display}"
    height: "176px"
  trouble-card:
    backgroundColor: "{colors.cardkind-trouble}"
    textColor: "{colors.cardkind-trouble-foreground}"
    typography: "{typography.body}"
    height: "56px"
  chip:
    backgroundColor: "{colors.cardkind-trouble}"
    textColor: "{colors.cardkind-trouble-foreground}"
    typography: "{typography.label}"
    height: "32px"
  step-pill:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    typography: "{typography.label}"
    height: "40px"
  gauge:
    backgroundColor: "{colors.surface-progress}"
    textColor: "{colors.primary}"
    height: "14px"
  portrait-badge:
    backgroundColor: "{colors.background}"
    size: "64px"
---

# Design System: 모두의 교실 디자인 스튜디오

정본: 토큰 값은 `docs/design-for-all/tokens.json`(`themes.flat-studio`, 2026-10-10 1차 게이트 확정, `chosenTheme`), UI 모양은 `시안/design-for-all/ui/kit/*.png`(Sol 생성·마젠타 키잉), 배치 수치는 2차 게이트에서 확정되는 `시안/design-for-all/2-플랫-*.html`. 세 곳이 어긋나면 **승인된 시안 HTML 의 수치**가 이긴다.

## Overview

**Creative North Star: "환한 작업실, 두꺼운 종이 타일"**

밝은 크림 작업대 위에 두꺼운 종이를 오려 붙인 것처럼 모든 것이 놓여 있다. 굵고 균일한 남색 윤곽선, 단색 면, 모서리는 둥글고, 그림자는 흐림 없이 **남색 판 하나가 아래로 4px 밀린 것**뿐이다. 교실 그림·NPC·책상 부품·카드·버튼이 전부 같은 손으로 그린 것이라 겹쳐도 한 장면이다. 글자는 전부 UI 층(DOM)에만 있다.

밀도는 "5학년이 크롬북 앞에서 혼자 40분"으로 잡는다. 한 화면에 결정 하나. 본문 20px, 제목·버튼 24px, 대사 30px, 숫자 40px. 안내문·힌트·부제 없음. 액센트는 코랄(`accent`) 하나 = 지금 누를 것. 청록(`primary`)은 끝난 단계·연결·채워진 진행. 반응 3색(만족·부분·불만)은 얼굴 아이콘과 글자와 항상 같이 간다.

이 게임은 유니버설 디자인을 가르치므로 UI 가 먼저 모범이어야 한다: 모든 글자 대비 4.5:1 이상(고대비 테마 7:1), 히트박스 48px, 키보드 포커스 링은 흰 4px + 코랄 4px 로 어느 바탕에서도 보이게, 글자 크기 2단(`html[data-text=large]` ×1.25), 색만으로 나누는 정보 0.

확정된 거부(사용자 규칙 2026-10-10 + 1차 게이트): CSS 사각형·SVG·이모지로 그린 UI, 그림 안의 글자, 카드 속 카드, 그라디언트·블러·유리, 캐주얼 3D 토이 플라스틱(world-trade 그림체), 종이 질감·제도 격자(탈락한 컨셉 2·3), NPC 희화화, 설명 문장.

**Key Characteristics:**
- UI 는 전부 **Sol 생성 스프라이트**: HUD 바·패널·대화 패널·불편 카드는 9-slice, 버튼(눌림 포함)·칩·단계 알약·게이지·아이콘·초상은 이미지. CSS 로 그리는 것은 포커스 링·텍스트 밑줄·레이아웃 격자뿐
- 그림자는 오프셋 단색 남색판(`shadow.card` 0 4px 0), 눌리면 2px 로 줄고(`shadow.press`) 버튼이 2px 내려간다 — 종이가 눌리는 느낌
- 모션은 셋뿐: 불편 카드 획득(대사 패널에서 하단 보관함으로 0.4초 날아감), 부품 끼움(슬롯 1.04배 튀고 0.15초 복귀), 반응 얼굴 등장(0.2초 팝). `prefers-reduced-motion` 이면 전부 즉시 전환

## Colors

크림 작업대 위에 흰 종이와 남색 선. 채도는 그림(NPC 옷·부품 색)이 올리고 UI 는 크림·흰·남색으로 가라앉힌다.

### Primary
- **Teal 청록** (#1F6F8B): 끝난 단계 알약, 연결선·연결 점, 채워진 게이지, 켜진 도구 버튼, 1차 버튼. "이미 한 것·이어진 것".
- **Navy 남색** (#1B2A41): 모든 윤곽·글자·그림자판. 종이를 작업대에서 떼어 놓는 선.

### Secondary
- **Coral 코랄** (#C8441B): 지금 단계 알약, 지금 누를 버튼, 포커스 링, 대사의 핵심 구절 밑줄. 화면에 한 군데. 면색·선 전용 — 크림·흰 바탕 위 글자는 4.3:1 로 모자라 **Coral Text** (#B33A12, 5.2:1)를 쓴다(큰 숫자·지금 슬롯 이름).
- **Butter 버터** (#FFE3B3): 2차 버튼(조사로·처음으로), 비활성 아님·덜 급한 것.

### Neutral
- **Cream** (#FFF8EC) 작업대 바탕·HUD 바 / **White** (#FFFFFF) 패널·대사·채워진 슬롯 / **Slot Tan** (#F1EADB) 빈 슬롯·게이지 트랙 / **Muted Text** (#4B5565) 보조 글자(16px 라벨) / **Classroom** (#DCEFF5) 교실 화면 바깥 / **Studio** (#F7EFE0) 조립대 화면 바깥.

### Card kinds
- **Trouble 불편** (#FFD6CC / 글자 #5A1F10) 불편 카드·연결 칩. **Case 사례** (#D7ECF7 / #0F3A4D) 사례 카드. **Ref 참고** (#E3F2D9 / #1E4620) 참고 카드. 세 종류는 색 + 좌상단 점 아이콘 + 라벨 글자로 구분한다.

### Status
- **Happy** (#2E7D4F) **Partial** (#9A5B00) **Unhappy** (#B3261E): 반응 얼굴 아이콘 배경과 반응 글자. 항상 `icon-face-*` 와 「만족/부분/불만」 글자가 같이 간다.
- **Element 6**: purpose 청록 · tech 보라 #5B4BB5 · function 호박 #B26A00 · beauty 분홍 #C2185B · access 코랄 #E4572E · eco 초록 #2E7D4F. 그래픽 전용(아이콘 배경·레이더 선·요소 태그 점). 글자색으로 쓰지 않는다 — 글자는 남색, 요소는 아이콘 + 이름.

## Typography

- **Jua** — 제목·버튼·대사·숫자(24 / 24 / 30 / 40). 둥근 붓글씨 고딕이라 굵은 남색 윤곽과 같은 무게. 15px 이하에는 쓰지 않는다(획이 뭉친다).
- **Noto Sans KR** — 본문 20 medium, 라벨 16 bold, 표·칩 글자. 긴 문장은 전부 여기.
- 글자 세로 배치는 **면 중심선에 절대 배치**(`line-height:1`, `translateY(-50%)`). 9-slice 버튼의 면 중심은 킷 측정값(2차 게이트에서 확정)으로 보정한다 — 오프셋 그림자 때문에 시각 중심이 2px 위다.
- 글자는 그림에 넣지 않는다. 글자가 박힌 생성 그림은 폐기한다. 폰트는 03 에서 self-host(woff2 인라인).

## Layout

- 스테이지 1280×800(`size.stage-*`), 바깥은 화면별 surface 색. 상단 HUD 바 72px: 좌 제목, 중 단계 알약 5, 우 도구 버튼(가 크게·고대비·소리).
- 교실(화면 3): 교실 그림 전면, NPC 6 은 그림 안 위치에 보이지 않는 48px 이상 히트 영역 + 이름 라벨. 우상단 카운터 패널, 하단 대사 패널 1100×176.
- 조립대(화면 6): 좌 미리보기 패널(제품 레이어 합성 420px 정사각 + 요소 게이지 3), 우 부품 패널(슬롯 5 행: 아이콘·슬롯 이름·고른 부품·연결 칩), 하단 불편 카드 보관함 + 조사로·테스트하기. 세부 배치는 2차 변주 3개(하단 트레이 / 좌측 단계 레일 / 큰 타일) 중 하나로 확정.
- 테스트(화면 7): NPC 초상 6 가로 띠, 가운데 반응 대사, 만족 수 숫자 40px.
- 그리드 8px. 히트박스 48px 이상. 한 화면에 1차 버튼 하나.

## Elevation & Depth

깊이는 스프라이트의 남색 오프셋 판이 가진다. CSS 섀도는 포커스 링 외에 쓰지 않는다. 블러·유리·그라디언트 없음. 겹침 순서: 그림 < 패널 < 대사·토스트 < 포커스 링.

## Shapes

두꺼운 종이를 오린 모양. 패널 둥근 22px, 버튼·카드 14px, 칩·알약 완전 둥글게, 도구 버튼 정사각 8px. 아이콘은 **크림 원 안의 단순 기호**(요소 6: 과녁·번개·톱니·팔레트·손과 하트·잎 / 슬롯 5: 둥근 사각·상하 화살·바퀴와 고리·재활용·물방울 / 제품 3: 책상·사물함·문 / 반응 3 얼굴 / 자물쇠·체크·리본 배지).

## Components (아트 킷 `ui/kit/`, 2차 게이트에서 slice 수치 확정)

| 컴포넌트 | 파일 | 쓰는 법 |
| --- | --- | --- |
| HUD 바 | `hud-bar.png` | 9-slice 가로 알약. 제목 24 Jua, 단계 알약 5, 도구 버튼 3 |
| 패널 | `panel.png` | 9-slice 흰 패널 + 남색 오프셋판. 내용 padding 16px 20px. 패널 안에 패널 금지 |
| 대사 패널 | `speech.png` | 9-slice, 좌 초상 배지 + 대사 30 Jua + 우 코랄 버튼. 꼬리는 그림 쪽 |
| 불편 카드 | `card-trouble.png` | 9-slice 코랄핑크 카드, 좌상단 점. 이름 Jua 16 + 한 줄 20 |
| 연결 칩 | `chip.png` | 완전 둥근 알약 32px, NPC 이름. 부품 행 오른쪽에 모인다 |
| 단계 알약 | `step-now.png`(코랄) `step.png`(크림) | 지금 = 코랄 + 흰 글자, 끝남 = CSS 로 청록 틴트 금지 → `step-done` 은 03 에서 Sol 추가 생성(지금은 크림 + 청록 체크 아이콘) |
| 버튼 | `btn-{teal,coral,paper}[-pressed].png` | 9-slice, 눌림은 pressed 파일로 교체. 글자 면 중심 절대 배치 |
| 도구 버튼 | `tool.png` `tool-on.png` | 48px 정사각, 가 크게·고대비·소리. 켜짐 = 청록 면 + 흰 글자 |
| 게이지 | `gauge-track.png` + `gauge-fill.png` | 트랙 9-slice 가로, 채움은 청록 세그먼트 width 로. 숫자 라벨 동반 |
| 아이콘 | `icon-*.png` 20종 | HUD 24 / 슬롯 행 32 / 결과 레이더 40. 항상 이름 글자와 같이 |
| NPC 초상 | `npc-{seoyun,dohyun,hajun,jian,haeun,grandma}.png` | 대사 패널 64 / 테스트 띠 80 / 칩 앞 24. 원형 배지 자체 포함 |
| 포커스 링·밑줄·격자 | CSS | 흰 4px + 코랄 4px 링, 코랄 밑줄 4px, 8px 격자 |

## 9-slice 수치 (2차 시안에서 측정, `시안/design-for-all/2-플랫-*.html` 공통 CSS)

원본 조각은 1536×1024 시트에서 잘라 그대로 쓴다(크기는 `ui/kit/` 파일 그대로). `border-image: url(...) <slice> fill / <width> stretch` + 같은 값의 `border-width`. **네 값 테두리는 `border` 단축이 아니라 `border-width` 로 쓴다**(단축에 네 값은 무효라 테두리가 0 이 되고 글자가 윤곽선 위에 올라간다 — 2차 시안에서 실측). 버튼은 `all:unset` 뒤 `box-sizing:border-box` 를 다시 준다. 상·하 조각 합이 원본 높이를 넘으면 가운데가 비어 알약이 갈라진다(`step-now` 에서 실측).

| 파일(원본 px) | slice (상 우 하 좌) | width (상 우 하 좌) | 요소 높이 |
| --- | --- | --- | --- |
| `hud-bar.png` 702×176 | 88 | 36 | 72 |
| `panel.png` 682×292 | 50 60 70 50 | 25 30 35 25 (얇은 변형 14 16 20 14) | 자유 |
| `speech.png` 696×323 | 80 40 40 130 | 40 20 20 65 | 176~190 |
| `card-trouble.png` 653×294 | 100 40 40 100 | 얇은 변형 12 6 8 12 | 42~44 |
| `chip.png` 444×159 | 80 | 16 | 32 |
| `step.png` 454×159 | 80 | 20 | 40 |
| `step-now.png` 461×174 | 50 85 70 80 | 13 20 18 18 | 44 |
| `btn-*.png` 543×161 | 40 50 56 40 | 20 25 28 20 (pressed 18 22 22 18 + 4px 내림) | 64 / paper 56 / 소형 44~48 |
| `tool.png` 178×177 | 50 60 70 50 | 14 16 19 14 | 48×64 |
| `gauge-track.png` 619×97 · `gauge-fill.png` 275×97 | 48 | 7 | 14 |
| `icon-*.png` 232² · `npc-*.png` 451² | `<img>` | — | 24/28/32/40 · 48/64/72/88/96/112 |

글자 면 중심: 버튼 `top:calc(50% - 2px)`, 지금 단계 알약 `calc(50% + 1px)`(오프셋 그림자 보정). 라벨은 `line-height:1`, `white-space:nowrap`.

## 고대비 킷 매핑 (2026-10-12, QA r1 #3 → 02 부분 재설계, 사용자 선택 "2")

`html[data-contrast=high]` 에서는 청록·코랄 면의 스프라이트를 Sol 이 새로 그린 진한 변형으로 바꾼다(`시안/design-for-all/prompts/ui-버튼세트-고대비.md`, 시트 `시안/design-for-all/ui/ui-버튼세트-고대비.png`). 위계(지금 누를 것 = 코랄 계열)는 유지한다. CSS 필터·CSS 로 칠한 면은 쓰지 않는다.

| 기본 | 고대비 | 원본 px | 면색 실측 | 흰 글자 대비 |
| --- | --- | --- | --- | --- |
| `btn-teal(.png/-pressed)` | `btn-teal-hc` / `btn-teal-pressed-hc` | 640×189 / 625×175 | rgb(1,41,123) | 13.1 |
| `btn-coral(-pressed)` | `btn-coral-hc` / `btn-coral-pressed-hc` | 640×189 / 625×177 | rgb(154,32,0) | 8.1 |
| `tool-on` | `tool-on-hc` | 210×202 | rgb(0,41,124) | 13.1 |
| `step-now` | `step-now-hc` | 699×196 | rgb(155,32,1) | 8.1 |
| `step` · `tool` | `step-hc` · `tool-hc`(크림 면 + 검정 윤곽, 검정 글자) | 736×190 · 210×205 | 크림 | 검정 글자 18+ |
| `btn-paper` · `panel` · `card-*` · `chip` | 그대로(크림·흰 면 위 검정 글자) | — | — | — |

**기본 테마에도 코랄 계열은 벽돌색 변형을 쓴다(2026-10-12 판정):** T13 렌더 대비 검사에서 기본 `btn-coral` 면(211,74,31) 위 흰 글자 4.35:1, `step-now` 4.49:1 로 4.5:1 미달(02 부터 있던 결함). 그래서 `.k-btn.coral`·`.k-step-now` 는 두 테마 모두 `btn-coral-hc`·`step-now-hc`(8.1:1). 청록은 기본 5.6:1 로 통과해 기본 테마에서는 원래 그림.

9-slice 는 원본 비율로 다시 잰다(새 시트는 기존보다 약 1.18배). 대비 검사는 토큰 쌍만이 아니라 **렌더된 스프라이트 면색 위 글자**까지 본다(QA r1 에서 드러난 검사 공백).

## Do's and Don'ts

- Do: 글자는 면 중심에 절대 배치하고 렌더를 측정한다. 결정은 화면당 하나. 지금 할 일만 코랄. 반응·요소는 아이콘 + 이름 + 색 셋 다. NPC 는 같은 비례·같은 표정 어휘로.
- Don't: CSS·SVG·이모지로 UI 그리기, 그림에 글자, 카드 속 카드, 그라디언트·블러, 토이 3D, 종이 질감·제도 격자, 색만으로 상태 나누기, "실패"·"틀렸다" 문구, 힌트·안내문.

## 레퍼런스 (하네스 02-3 필수 3요소)

| 출처 | 왜 골랐나 | 어디를 차용 | **어디는 따르면 안 되나** |
| --- | --- | --- | --- |
| Sol 생성 UI 아트 킷(자체, `시안/design-for-all/ui/`) | UI 의 유일한 출처. 외부 UI 팩·아이콘 폰트·SVG 를 섞지 않는다(사용자 규칙) | `ui/kit/*` 전부, 1차 그림 `1-플랫-교실.png`·`1-플랫-책상모형.png` 의 선 굵기·색 | 시트에서 겹쳐 잘린 조각은 쓰지 않는다. 글자·실존 제품·실존 인물이 박힌 결과는 폐기. 마젠타 번짐 가장자리는 재검수 |
| world-trade(`docs/world-trade/DESIGN.md`) | 같은 하네스의 **생산 방식** 선례: 9-slice 스프라이트 UI, 글자 면 중심 측정, 화면당 결정 하나 | 9-slice `border-image` 수치화, 글자 절대 배치·측정 절차, 폰트 self-host, 마젠타 키잉 파이프라인 | 그림체(캐주얼 3D·클레이), 크림 토이 플라스틱·남색 림·파스텔 팔레트, HUD 수치 노출 — 따르지 않는다(사용자 2026-10-10 "그림체를 따라하라는 건 아니야") |
| ui.shadcn.com | 시멘틱 토큰 **이름** 구조만 | `background/foreground/card/primary/secondary/muted/accent/border/ring` 이름과 `*-foreground` 짝, 게임 역할 토큰은 그 아래 확장 | 회색 중립 팔레트·1px 테두리·블러 섀도·0.5rem radius·CSS 버튼 모양 전부 따르지 않는다 |
| 교과서 미술 5 10단원(요소 6·과정 5단계) | 단계 이름·요소 이름의 출처 | 「문제점 찾기→조사하기→설계하기→테스트·수정→돌아보기」 알약 5, 요소 6 아이콘 이름 | 교과서의 레이아웃·사진·색은 가져오지 않는다. 이름만 |

aceternity·magicui·reactbits·originui·AntV 는 쓰지 않는다. 결과 화면 요소 6 레이더는 Sol 생성 `icon-*` + CSS 선 하나로 그리며 차트 라이브러리를 들이지 않는다. 모션 셋은 CSS 키프레임이라 모션 라이브러리가 필요 없다.
