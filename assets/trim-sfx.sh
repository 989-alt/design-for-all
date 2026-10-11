#!/bin/bash
# Suno Sounds 원본을 효과음으로 자른다: 앞 무음 제거 → 목표 길이 → 끝 페이드 → 음량 맞춤(-18 LUFS).
# 사용: trim-sfx.sh <원본.mp3> <출력.mp3> <초>   (ffmpeg 경로: env FFMPEG 또는 PATH)
set -e; IN="$1"; OUT="$2"; D="$3"; FF="${FFMPEG:-ffmpeg}"
F=$(python3 -c "print(max(0.05, min(0.25, $D*0.2)))")
"$FF" -hide_banner -loglevel error -y -i "$IN" -af "silenceremove=start_periods=1:start_threshold=-40dB:start_silence=0.02,atrim=0:$D,asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st=$(python3 -c "print($D-$F)"):d=$F,loudnorm=I=-18:TP=-2:LRA=7" -ar 44100 -ac 2 -b:a 128k "$OUT"
