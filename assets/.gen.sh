#!/bin/bash
# 에셋 양산 배치 — Sol(run.sh image). 빠진 PNG 만 생성, 한도 메시지의 재시도 시각까지 대기, 최대 12라운드.
cd "/Users/seonhak/Desktop/educational game"
L="design-for-all/assets/.gen.log"; OUT="design-for-all/assets/img"; PR="design-for-all/assets/prompts"
ORDER="bg-classroom keyart-title npc-partial npc-unhappy case-sheet-1 case-sheet-2 ref-sheet-1 ref-sheet-2 ref-sheet-3 sample-sheet feedback-sheet desk-form desk-height desk-move locker-form locker-lock locker-label door-form door-handle door-label tiles-material-color ui-extra"
echo "[$(date +%H:%M:%S)] 시작" >> "$L"
for round in $(seq 1 12); do
  missing=""; for n in $ORDER; do [ -f "$OUT/$n.png" ] || missing="$missing $n"; done
  [ -z "$missing" ] && break
  echo "[$(date +%H:%M:%S)] 라운드 $round — 남은:$missing" >> "$L"
  limited=""
  for n in $missing; do
    bash harness/bin/run.sh image "$PR/$n.md" --out "$OUT" >> "$L" 2>&1
    if [ ! -f "$OUT/$n.png" ]; then
      t=$(grep -oE "try again at [0-9]{1,2}:[0-9]{2}" "$OUT/.$n.log" 2>/dev/null | tail -1 | grep -oE "[0-9]{1,2}:[0-9]{2}")
      if [ -n "$t" ]; then limited="$t"; echo "[$(date +%H:%M:%S)] $n 한도 → $t" >> "$L"; break; fi
      echo "[$(date +%H:%M:%S)] $n 실패(한도 아님)" >> "$L"
    fi
  done
  missing2=""; for n in $ORDER; do [ -f "$OUT/$n.png" ] || missing2="$missing2 $n"; done
  [ -z "$missing2" ] && break
  if [ -n "$limited" ]; then
    now=$(date +%s); tgt=$(date -j -f "%Y-%m-%d %H:%M" "$(date +%Y-%m-%d) $limited" +%s 2>/dev/null || echo $((now+900)))
    [ "$tgt" -le "$now" ] && tgt=$((tgt+86400)); w=$((tgt-now+60)); [ "$w" -gt 21600 ] && w=900
    echo "[$(date +%H:%M:%S)] ${w}초 대기" >> "$L"; sleep "$w"
  else sleep 900; fi
done
missing=""; for n in $ORDER; do [ -f "$OUT/$n.png" ] || missing="$missing $n"; done
echo "[$(date +%H:%M:%S)] 끝 — 남은:${missing:- 없음}" >> "$L"; touch design-for-all/assets/.gen.done
