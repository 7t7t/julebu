<template>
  <div class="tts-page">
    <div class="tts-container">
      <!-- 标题 -->
      <div class="tts-header">
        <h1 class="tts-title">语音试听工坊</h1>
        <p class="tts-subtitle">调整参数匹配 CET-6 听力男声，保存后课程自动使用此声音</p>
      </div>

      <!-- 输入区域 -->
      <div class="tts-card">
        <label class="tts-label">输入文本</label>
        <textarea
          v-model="text"
          class="tts-textarea"
          rows="3"
          placeholder="Type any English sentence here..."
          maxlength="2000"
        ></textarea>
        <div class="tts-char-count">{{ text.length }} / 2000</div>
      </div>

      <!-- 声音选择 -->
      <div class="tts-card">
        <label class="tts-label">声音选择</label>
        <div class="tts-radio-group">
          <button
            :class="['tts-radio-btn', voice === 'male' && 'tts-radio-btn--active']"
            @click="voice = 'male'"
          >
            <UIcon
              name="i-ph-gender-male"
              class="h-5 w-5"
            />
            男声
          </button>
          <button
            :class="['tts-radio-btn', voice === 'female' && 'tts-radio-btn--active']"
            @click="voice = 'female'"
          >
            <UIcon
              name="i-ph-gender-female"
              class="h-5 w-5"
            />
            女声
          </button>
        </div>

        <!-- 具体声音模型 -->
        <label class="tts-label mt-4">声音模型</label>
        <div class="tts-voice-grid">
          <button
            v-for="v in voice === 'male' ? maleVoices : femaleVoices"
            :key="v.name"
            :class="['tts-voice-btn', voiceName === v.name && 'tts-voice-btn--active']"
            @click="voiceName = v.name"
          >
            <span class="tts-voice-btn-name">{{ v.label }}</span>
            <span class="tts-voice-btn-desc">{{ v.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 基础参数 -->
      <div class="tts-card">
        <label class="tts-label">基础参数</label>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name"
              ><UIcon
                name="i-ph-gauge"
                class="h-4 w-4"
              />
              语速</span
            >
            <span class="tts-slider-value">{{ fmtPct(rate) }}</span>
          </div>
          <input
            v-model.number="rate"
            type="range"
            min="-50"
            max="100"
            step="5"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>慢 (-50%)</span><span>正常</span><span>快 (+100%)</span>
          </div>
        </div>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name"
              ><UIcon
                name="i-ph-wave-sine"
                class="h-4 w-4"
              />
              音调</span
            >
            <span class="tts-slider-value">{{ fmtHz(pitch) }}</span>
          </div>
          <input
            v-model.number="pitch"
            type="range"
            min="-50"
            max="50"
            step="1"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>低沉 (-50Hz)</span><span>正常</span><span>尖锐 (+50Hz)</span>
          </div>
        </div>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name"
              ><UIcon
                name="i-ph-speaker-high"
                class="h-4 w-4"
              />
              音量</span
            >
            <span class="tts-slider-value">{{ fmtPct(volume) }}</span>
          </div>
          <input
            v-model.number="volume"
            type="range"
            min="-50"
            max="50"
            step="5"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>轻 (-50%)</span><span>正常</span><span>响 (+50%)</span>
          </div>
        </div>
      </div>

      <!-- 高级调参: 自然度 -->
      <div class="tts-card">
        <label class="tts-label">自然度调节</label>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name">
              <UIcon
                name="i-ph-pause"
                class="h-4 w-4"
              />
              句间停顿
            </span>
            <span class="tts-slider-value">{{ sentenceBreak }}ms</span>
          </div>
          <input
            v-model.number="sentenceBreak"
            type="range"
            min="200"
            max="1000"
            step="50"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>紧凑 (200ms)</span><span>标准</span><span>从容 (1000ms)</span>
          </div>
        </div>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name">
              <UIcon
                name="i-ph-dots-three"
                class="h-4 w-4"
              />
              从句停顿
            </span>
            <span class="tts-slider-value">{{ clauseBreak }}ms</span>
          </div>
          <input
            v-model.number="clauseBreak"
            type="range"
            min="50"
            max="500"
            step="25"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>连读感 (50ms)</span><span>标准</span><span>逐字清晰 (500ms)</span>
          </div>
        </div>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name">
              <UIcon
                name="i-ph-radio"
                class="h-4 w-4"
              />
              低频噪声
            </span>
            <span class="tts-slider-value">{{ lowFreqNoise }}%</span>
          </div>
          <input
            v-model.number="lowFreqNoise"
            type="range"
            min="0"
            max="60"
            step="5"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>无噪声</span><span>轻微底噪</span><span>考场环境 (60%)</span>
          </div>
        </div>

        <div class="tts-slider-row">
          <div class="tts-slider-header">
            <span class="tts-slider-name">
              <UIcon
                name="i-ph-equalizer"
                class="h-4 w-4"
              />
              暖声滤波
            </span>
            <span class="tts-slider-value">{{ warmth }}%</span>
          </div>
          <input
            v-model.number="warmth"
            type="range"
            min="0"
            max="100"
            step="5"
            class="tts-range"
          />
          <div class="tts-range-labels">
            <span>数字清亮</span><span>自然</span><span>广播温暖 (100%)</span>
          </div>
        </div>
      </div>

      <!-- 预设方案 -->
      <div class="tts-card">
        <label class="tts-label">CET-6 预设方案</label>
        <div class="tts-presets">
          <button
            v-for="preset in presets"
            :key="preset.name"
            class="tts-preset-btn"
            @click="applyPreset(preset)"
          >
            <span class="tts-preset-icon">{{ preset.icon }}</span>
            <span class="tts-preset-name">{{ preset.name }}</span>
            <span class="tts-preset-desc">{{ preset.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="tts-actions">
        <button
          class="tts-play-btn"
          :disabled="!text.trim() || isPlaying"
          @click="handlePlay"
        >
          <UIcon
            :name="isPlaying ? 'i-ph-spinner' : 'i-ph-play-circle'"
            class="h-6 w-6"
            :class="{ 'animate-spin': isPlaying }"
          />
          {{ isPlaying ? "生成中..." : "播放试听" }}
        </button>
        <button
          class="tts-stop-btn"
          :disabled="!isPlaying && !audioEl"
          @click="handleStop"
        >
          <UIcon
            name="i-ph-stop-circle"
            class="h-5 w-5"
          />
          停止
        </button>
        <button
          class="tts-reset-btn"
          @click="handleReset"
        >
          <UIcon
            name="i-ph-arrow-counter-clockwise"
            class="h-5 w-5"
          />
          重置
        </button>
      </div>

      <!-- 保存按钮 -->
      <div class="tts-card tts-save-card">
        <div class="tts-save-info">
          <UIcon
            name="i-ph-floppy-disk"
            class="h-5 w-5 text-purple-500"
          />
          <span>保存后，所有课程发音都将使用当前设置</span>
        </div>
        <button
          class="tts-save-btn"
          @click="handleSave"
        >
          <UIcon
            name="i-ph-check-circle"
            class="h-5 w-5"
          />
          保存为课程声音
        </button>
        <div
          v-if="saved"
          class="tts-saved-msg"
        >
          <UIcon
            name="i-ph-check"
            class="h-4 w-4"
          />
          已保存！课程将使用此声音。
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { usePronunciation, VoiceGender } from "~/composables/user/pronunciation";

const { voiceSettings, buildTtsUrl, saveVoiceSettings, toggleVoiceGender } = usePronunciation();

// 声音模型列表
interface VoiceModel {
  name: string;
  label: string;
  desc: string;
}

const maleVoices: VoiceModel[] = [
  { name: "en-US-GuyNeural", label: "Guy", desc: "六级真题校准，推荐" },
  { name: "en-US-AndrewNeural", label: "Andrew", desc: "自然沉稳" },
  { name: "en-US-BrianNeural", label: "Brian", desc: "清晰专业" },
  { name: "en-US-ChristopherNeural", label: "Christopher", desc: "浑厚低沉" },
  { name: "en-US-DavisNeural", label: "Davis", desc: "温和自然" },
  { name: "en-US-EricNeural", label: "Eric", desc: "成熟稳重" },
];

const femaleVoices: VoiceModel[] = [
  { name: "en-US-JennyNeural", label: "Jenny", desc: "清晰标准" },
  { name: "en-US-AriaNeural", label: "Aria", desc: "自然亲和" },
  { name: "en-US-SaraNeural", label: "Sara", desc: "柔和温暖" },
  { name: "en-US-MichelleNeural", label: "Michelle", desc: "专业播报" },
];

// 从已保存的设置初始化
const text = ref(
  "There are at least four major problems with work in America today. First work can be alienating. Workers are often not in control of how they work when they work, what is done with the goods and services they produce and with is done with the profits made from their work.",
);
const voice = ref<"male" | "female">(voiceSettings.gender || "male");
const voiceName = ref(voiceSettings.voiceName || "en-US-AndrewNeural");
const rate = ref(parseNum(voiceSettings.rate, -12));
const pitch = ref(parseNum(voiceSettings.pitch, 0));
const volume = ref(parseNum(voiceSettings.volume, 5));
const isPlaying = ref(false);
const saved = ref(false);

// 自然度参数
const sentenceBreak = ref(parseNum(voiceSettings.sentenceBreak, 500));
const clauseBreak = ref(parseNum(voiceSettings.clauseBreak, 200));
const lowFreqNoise = ref(voiceSettings.lowFreqNoise ?? 0);
const warmth = ref(voiceSettings.warmth ?? 0);

// Web Audio API 上下文 (懒初始化)
let audioCtx: AudioContext | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let noiseGain: GainNode | null = null;

// 切换男/女声时自动选择默认声音模型
watch(voice, (val) => {
  if (val === "male") {
    voiceName.value = "en-US-AndrewNeural";
  } else {
    voiceName.value = "en-US-JennyNeural";
  }
});

let audioEl: HTMLAudioElement | null = null;

function parseNum(val: string | undefined, fallback: number): number {
  if (!val) return fallback;
  const n = parseInt(val.replace(/[^-\d]/g, ""), 10);
  return isNaN(n) ? fallback : n;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

function fmtHz(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}Hz`;
}

// 预设方案
interface Preset {
  name: string;
  icon: string;
  desc: string;
  voice: "male" | "female";
  voiceName: string;
  rate: number;
  pitch: number;
  volume: number;
  sentenceBreak: number;
  clauseBreak: number;
  lowFreqNoise: number;
  warmth: number;
}

const presets: Preset[] = [
  {
    name: "CET-6 标准男声",
    icon: "🎓",
    desc: "2025年六级真题音频校准",
    voice: "male",
    voiceName: "en-US-GuyNeural",
    rate: -10,
    pitch: -4,
    volume: 3,
    sentenceBreak: 650,
    clauseBreak: 280,
    lowFreqNoise: 12,
    warmth: 40,
  },
  {
    name: "CET-6 短对话",
    icon: "🗨️",
    desc: "Section A 对话语速",
    voice: "male",
    voiceName: "en-US-GuyNeural",
    rate: -5,
    pitch: -3,
    volume: 3,
    sentenceBreak: 500,
    clauseBreak: 180,
    lowFreqNoise: 10,
    warmth: 35,
  },
  {
    name: "CET-6 长篇章",
    icon: "📝",
    desc: "Section B/C 文章朗读",
    voice: "male",
    voiceName: "en-US-GuyNeural",
    rate: -10,
    pitch: -4,
    volume: 3,
    sentenceBreak: 650,
    clauseBreak: 280,
    lowFreqNoise: 12,
    warmth: 40,
  },
  {
    name: "CET-6 讲座",
    icon: "🎤",
    desc: "Section C 学术讲座",
    voice: "male",
    voiceName: "en-US-GuyNeural",
    rate: -8,
    pitch: -5,
    volume: 3,
    sentenceBreak: 600,
    clauseBreak: 250,
    lowFreqNoise: 15,
    warmth: 42,
  },
  {
    name: "CET-6 标准女声",
    icon: "🎓",
    desc: "清晰标准女声",
    voice: "female",
    voiceName: "en-US-JennyNeural",
    rate: -10,
    pitch: 0,
    volume: 5,
    sentenceBreak: 500,
    clauseBreak: 200,
    lowFreqNoise: 10,
    warmth: 20,
  },
  {
    name: "慢速精听",
    icon: "🐢",
    desc: "辅音清晰，适合精听",
    voice: "male",
    voiceName: "en-US-AndrewNeural",
    rate: -30,
    pitch: -3,
    volume: 10,
    sentenceBreak: 800,
    clauseBreak: 400,
    lowFreqNoise: 5,
    warmth: 15,
  },
  {
    name: "日常对话",
    icon: "🗣️",
    desc: "自然母语语速",
    voice: "male",
    voiceName: "en-US-DavisNeural",
    rate: 0,
    pitch: 0,
    volume: 0,
    sentenceBreak: 400,
    clauseBreak: 120,
    lowFreqNoise: 0,
    warmth: 10,
  },
  {
    name: "快速跟读",
    icon: "⚡",
    desc: "连读弱读训练",
    voice: "male",
    voiceName: "en-US-GuyNeural",
    rate: 15,
    pitch: 0,
    volume: 0,
    sentenceBreak: 300,
    clauseBreak: 75,
    lowFreqNoise: 0,
    warmth: 5,
  },
  {
    name: "沉稳播报",
    icon: "📺",
    desc: "新闻播报风格",
    voice: "male",
    voiceName: "en-US-ChristopherNeural",
    rate: -8,
    pitch: -10,
    volume: 8,
    sentenceBreak: 600,
    clauseBreak: 250,
    lowFreqNoise: 10,
    warmth: 50,
  },
  {
    name: "清晰朗读",
    icon: "📖",
    desc: "每字清晰可辨",
    voice: "male",
    voiceName: "en-US-BrianNeural",
    rate: -15,
    pitch: 0,
    volume: 8,
    sentenceBreak: 650,
    clauseBreak: 350,
    lowFreqNoise: 0,
    warmth: 10,
  },
];

function applyPreset(preset: Preset) {
  voice.value = preset.voice;
  voiceName.value = preset.voiceName;
  rate.value = preset.rate;
  pitch.value = preset.pitch;
  volume.value = preset.volume;
  sentenceBreak.value = preset.sentenceBreak;
  clauseBreak.value = preset.clauseBreak;
  lowFreqNoise.value = preset.lowFreqNoise;
  warmth.value = preset.warmth;
}

/**
 * 生成低频棕色噪声 buffer (模拟考场/广播环境底噪)
 * 棕色噪声比白噪声更低沉自然，接近真实录音环境
 */
function createBrownNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    // 棕色噪声: 积分白噪声，低频为主
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

/**
 * 启动低频噪声层 (Web Audio API)
 */
function startNoise(duration: number) {
  if (lowFreqNoise.value <= 0) return;

  audioCtx = audioCtx || new AudioContext();
  const ctx = audioCtx;

  // 棕色噪声源
  const noiseBuffer = createBrownNoiseBuffer(ctx, Math.max(duration, 30));
  noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  // 低通滤波 — 只保留低频 (< 300Hz)，更像考场底噪
  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = "lowpass";
  lpFilter.frequency.value = 250;
  lpFilter.Q.value = 0.7;

  // 音量控制: lowFreqNoise 0~60 → gain 0~0.06
  noiseGain = ctx.createGain();
  noiseGain.gain.value = lowFreqNoise.value * 0.001;

  noiseSource.connect(lpFilter);
  lpFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSource.start();
}

/**
 * 停止噪声层
 */
function stopNoise() {
  if (noiseSource) {
    try {
      noiseSource.stop();
    } catch {}
    noiseSource.disconnect();
    noiseSource = null;
  }
  if (noiseGain) {
    noiseGain.disconnect();
    noiseGain = null;
  }
}

/**
 * 通过 Web Audio API 播放，加暖声滤波效果
 */
async function playWithAudioProcessing(url: string) {
  audioCtx = audioCtx || new AudioContext();
  const ctx = audioCtx;

  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;

  let lastNode: AudioNode = source;

  // 暖声滤波: 轻微低通 + 高频衰减，模拟广播/磁带质感
  if (warmth.value > 0) {
    // 低通截止: warmth 0~100 → 频率 20000Hz ~ 3000Hz
    const cutoff = 20000 - warmth.value * 170;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = cutoff;
    lpf.Q.value = 0.5;
    lastNode.connect(lpf);
    lastNode = lpf;

    // 低频轻微提升 (更温暖)
    if (warmth.value > 30) {
      const bass = ctx.createBiquadFilter();
      bass.type = "lowshelf";
      bass.frequency.value = 200;
      bass.gain.value = warmth.value * 0.06; // 最多 +6dB
      lastNode.connect(bass);
      lastNode = bass;
    }
  }

  lastNode.connect(ctx.destination);

  // 启动低频噪声层
  startNoise(audioBuffer.duration);

  source.onended = () => {
    isPlaying.value = false;
    stopNoise();
    source.disconnect();
  };

  source.start();
  isPlaying.value = false;

  // 保存引用以便停止
  audioEl = {
    pause: () => {
      source.stop();
      stopNoise();
    },
    currentTime: 0,
  } as any;
}

function handlePlay() {
  if (!text.value.trim()) return;
  handleStop();
  isPlaying.value = true;

  const url = buildTtsUrl(text.value, {
    voice: voice.value,
    voiceName: voiceName.value,
    rate: fmtPct(rate.value),
    pitch: fmtHz(pitch.value),
    volume: fmtPct(volume.value),
    sentenceBreak: `${sentenceBreak.value}ms`,
    clauseBreak: `${clauseBreak.value}ms`,
  });

  // 需要音频后处理时用 Web Audio API
  if (lowFreqNoise.value > 0 || warmth.value > 0) {
    playWithAudioProcessing(url).catch(() => {
      isPlaying.value = false;
    });
    return;
  }

  // 无后处理时用普通 Audio 元素
  audioEl = new Audio(url);
  audioEl.oncanplaythrough = () => {
    isPlaying.value = false;
    audioEl?.play().catch(() => {});
  };
  audioEl.onended = () => {
    isPlaying.value = false;
  };
  audioEl.onerror = () => {
    isPlaying.value = false;
  };
  audioEl.load();
}

function handleStop() {
  stopNoise();
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl = null;
  }
  isPlaying.value = false;
}

function handleReset() {
  handleStop();
  voice.value = "male";
  voiceName.value = "en-US-GuyNeural";
  rate.value = -10;
  pitch.value = -4;
  volume.value = 3;
  sentenceBreak.value = 650;
  clauseBreak.value = 280;
  lowFreqNoise.value = 12;
  warmth.value = 40;
}

function handleSave() {
  toggleVoiceGender(voice.value === "female" ? VoiceGender.Female : VoiceGender.Male);
  saveVoiceSettings({
    gender: voice.value === "female" ? VoiceGender.Female : VoiceGender.Male,
    rate: fmtPct(rate.value),
    pitch: fmtHz(pitch.value),
    volume: fmtPct(volume.value),
    style: "",
    styleDegree: "1.0",
    emphasis: "",
    contour: "",
    naturalPause: true,
    sentenceBreak: `${sentenceBreak.value}ms`,
    clauseBreak: `${clauseBreak.value}ms`,
    lowFreqNoise: lowFreqNoise.value,
    warmth: warmth.value,
    voiceName: voiceName.value,
  });
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 3000);
}
</script>

<style scoped>
.tts-page {
  @apply mx-auto max-w-2xl px-4 py-8;
}
.tts-container {
  @apply flex flex-col gap-5;
}
.tts-header {
  @apply text-center;
}
.tts-title {
  @apply text-2xl font-bold text-gray-800 dark:text-gray-100;
}
.tts-subtitle {
  @apply mt-1 text-sm text-gray-500 dark:text-gray-400;
}

/* 卡片 */
.tts-card {
  @apply rounded-2xl p-5;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.dark .tts-card {
  background: #1a1a2e;
  border-color: rgba(255, 255, 255, 0.06);
}
.tts-label {
  @apply mb-3 block text-sm font-semibold text-gray-700 dark:text-gray-300;
}

/* 输入框 */
.tts-textarea {
  @apply w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-base outline-none transition-colors;
  @apply focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100;
  @apply dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-700 dark:focus:ring-purple-900;
}
.tts-char-count {
  @apply mt-1 text-right text-xs text-gray-400;
}

/* 声音选择 */
.tts-radio-group {
  @apply flex gap-3;
}
.tts-radio-btn {
  @apply flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition-all;
  @apply hover:border-purple-300 hover:text-purple-600;
  @apply dark:border-gray-600 dark:text-gray-400;
}
.tts-radio-btn--active {
  @apply border-purple-500 bg-purple-50 text-purple-700;
  @apply dark:border-purple-400 dark:bg-purple-900/20 dark:text-purple-300;
}

/* 声音模型选择 */
.tts-voice-grid {
  @apply grid grid-cols-2 gap-2;
}
@media (min-width: 640px) {
  .tts-voice-grid {
    @apply grid-cols-3;
  }
}
.tts-voice-btn {
  @apply flex flex-col items-center gap-0.5 rounded-xl border-2 border-gray-200 px-3 py-2.5 text-xs transition-all;
  @apply hover:border-purple-300 hover:bg-purple-50;
  @apply dark:border-gray-600 dark:hover:border-purple-500 dark:hover:bg-purple-900/20;
}
.tts-voice-btn--active {
  @apply border-purple-500 bg-purple-50 text-purple-700;
  @apply dark:border-purple-400 dark:bg-purple-900/20 dark:text-purple-300;
}
.tts-voice-btn-name {
  @apply text-sm font-semibold text-gray-700 dark:text-gray-300;
}
.tts-voice-btn--active .tts-voice-btn-name {
  @apply text-purple-700 dark:text-purple-300;
}
.tts-voice-btn-desc {
  @apply text-xs text-gray-400;
}

/* 滑块 */
.tts-slider-row {
  @apply mb-5 last:mb-0;
}
.tts-slider-header {
  @apply mb-2 flex items-center justify-between;
}
.tts-slider-name {
  @apply flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400;
}
.tts-slider-value {
  @apply rounded-md bg-purple-50 px-2 py-0.5 font-mono text-xs font-semibold text-purple-700;
  @apply dark:bg-purple-900/30 dark:text-purple-300;
}
.tts-range {
  @apply w-full cursor-pointer appearance-none rounded-full bg-gray-200 dark:bg-gray-700;
  height: 6px;
}
.tts-range::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(124, 58, 237, 0.3);
}
.tts-range-labels {
  @apply mt-1 flex justify-between text-xs text-gray-400;
}

/* 预设 */
.tts-presets {
  @apply grid grid-cols-2 gap-2;
}
@media (min-width: 640px) {
  .tts-presets {
    @apply grid-cols-4;
  }
}
.tts-preset-btn {
  @apply flex flex-col items-center gap-1 rounded-xl border border-gray-200 px-3 py-3 text-xs transition-all;
  @apply hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm;
  @apply dark:border-gray-600 dark:hover:border-purple-500 dark:hover:bg-purple-900/20;
}
.tts-preset-icon {
  font-size: 1.25rem;
}
.tts-preset-name {
  @apply font-medium text-gray-600 dark:text-gray-400;
}
.tts-preset-desc {
  @apply text-xs text-gray-400;
}

/* 操作按钮 */
.tts-actions {
  @apply flex gap-3;
}
.tts-play-btn {
  @apply flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-all;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
}
.tts-play-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.4);
}
.tts-play-btn:disabled {
  @apply cursor-not-allowed opacity-50;
}
.tts-stop-btn {
  @apply flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-5 py-3 text-sm font-medium text-gray-600 transition-all;
  @apply hover:border-red-400 hover:text-red-500;
  @apply dark:border-gray-600 dark:text-gray-400;
}
.tts-stop-btn:disabled {
  @apply cursor-not-allowed opacity-40;
}
.tts-reset-btn {
  @apply flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-500 transition-all;
  @apply hover:border-gray-400 hover:text-gray-700;
  @apply dark:border-gray-600 dark:text-gray-400;
}

/* 保存区 */
.tts-save-card {
  @apply flex flex-col items-center gap-3;
  border: 2px dashed rgba(124, 58, 237, 0.3);
  background: rgba(124, 58, 237, 0.02);
}
.dark .tts-save-card {
  background: rgba(124, 58, 237, 0.05);
}
.tts-save-info {
  @apply flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400;
}
.tts-save-btn {
  @apply flex items-center gap-2 rounded-xl px-8 py-3 text-base font-semibold text-white transition-all;
  background: linear-gradient(135deg, #059669, #10b981);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.tts-save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
}
.tts-saved-msg {
  @apply flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
