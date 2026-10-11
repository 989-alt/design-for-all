#!/bin/bash
# 효과음 8 — kie.ai ElevenLabs. 빠진 것만, 30분 간격 최대 12라운드(kie 500 일시 장애 대비)
cd "$(dirname "$0")"; L=.sfx-gen.log
for round in $(seq 1 12); do
  miss=""; for n in sfx-card sfx-snap sfx-link sfx-happy sfx-partial sfx-unhappy sfx-revise sfx-grade; do [ -f "sfx/$n.mp3" ] || miss="$miss $n"; done
  [ -z "$miss" ] && break
  echo "[$(date +%H:%M:%S)] 라운드 $round —$miss" >> $L
  for n in $miss; do node kie-audio.mjs sfx "prompts/audio/$n.json" "sfx/$n.mp3" >> $L 2>&1; done
  miss=""; for n in sfx-card sfx-snap sfx-link sfx-happy sfx-partial sfx-unhappy sfx-revise sfx-grade; do [ -f "sfx/$n.mp3" ] || miss="$miss $n"; done
  [ -z "$miss" ] && break; sleep 1800
done
echo "[$(date +%H:%M:%S)] 끝 — 남은:${miss:- 없음}" >> $L; touch .sfx-gen.done
