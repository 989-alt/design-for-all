// 소리 매니페스트. BGM 은 필수, 효과음은 생성 중일 수 있어 선택(없으면 no-op). check-assets.mjs 가 이 파일을 읽는다
export const BGM = ['bgm-studio', 'bgm-result'] as const;
export const SFX = ['sfx-card', 'sfx-snap', 'sfx-link', 'sfx-happy', 'sfx-partial', 'sfx-unhappy', 'sfx-revise', 'sfx-grade'] as const;
export type BgmName = (typeof BGM)[number];
export type SfxName = (typeof SFX)[number];
