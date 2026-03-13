import { usePronunciation } from "~/composables/user/pronunciation";

/**
 * CET-6 听力标准男声音频播放模块
 *
 * 使用后端 Edge TTS 服务 (en-US-AndrewNeural) 生成的音频
 * 自动缓存、错误回退到有道 API
 * 支持 Web Audio API 后处理 (低频噪声 + 暖声滤波)
 */

const { getPronunciationUrl, getYoudaoUrl, voiceSettings } = usePronunciation();

// ========== Web Audio 后处理 ==========

let audioCtx: AudioContext | null = null;
let activeNoiseSource: AudioBufferSourceNode | null = null;
let activeNoiseGain: GainNode | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function createBrownNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    lastOut = (lastOut + 0.02 * white) / 1.02;
    data[i] = lastOut * 3.5;
  }
  return buffer;
}

function startNoiseLayer(duration: number) {
  const noise = voiceSettings.lowFreqNoise;
  if (!noise || noise <= 0) return;

  const ctx = getAudioCtx();
  const noiseBuffer = createBrownNoiseBuffer(ctx, Math.max(duration, 30));
  activeNoiseSource = ctx.createBufferSource();
  activeNoiseSource.buffer = noiseBuffer;
  activeNoiseSource.loop = true;

  const lpFilter = ctx.createBiquadFilter();
  lpFilter.type = "lowpass";
  lpFilter.frequency.value = 250;
  lpFilter.Q.value = 0.7;

  activeNoiseGain = ctx.createGain();
  activeNoiseGain.gain.value = noise * 0.001;

  activeNoiseSource.connect(lpFilter);
  lpFilter.connect(activeNoiseGain);
  activeNoiseGain.connect(ctx.destination);
  activeNoiseSource.start();
}

function stopNoiseLayer() {
  if (activeNoiseSource) {
    try {
      activeNoiseSource.stop();
    } catch {}
    activeNoiseSource.disconnect();
    activeNoiseSource = null;
  }
  if (activeNoiseGain) {
    activeNoiseGain.disconnect();
    activeNoiseGain = null;
  }
}

/** 是否需要 Web Audio 后处理 */
function needsPostProcessing(): boolean {
  return voiceSettings.lowFreqNoise > 0 || voiceSettings.warmth > 0;
}

// ========== 主音频 ==========

let currentText = "";
const audio = new Audio();

// Edge TTS 失败时回退到有道
audio.addEventListener("error", () => {
  if (currentText) {
    const youdaoUrl = getYoudaoUrl(currentText);
    if (audio.src !== youdaoUrl) {
      audio.src = youdaoUrl;
      audio.load();
      audio.play().catch(() => {});
    }
  }
});

export function updateSource(src: string, text?: string) {
  currentText =
    text ||
    (() => {
      try {
        const url = new URL(src);
        return decodeURIComponent(
          url.searchParams.get("text") || url.searchParams.get("audio") || "",
        );
      } catch {
        return "";
      }
    })();
  audio.src = src;
  audio.load();
}

// ========== 单词播放 ==========

export function usePlayWordSound() {
  let lastWord = "";
  let isPlaying = false;
  let wordAudio: HTMLAudioElement | null = null;

  function handlePlayWordSound(word: string) {
    if (isPlaying && lastWord === word) return;

    // 停止上一次
    if (wordAudio) {
      wordAudio.pause();
      wordAudio.currentTime = 0;
    }

    lastWord = word;
    isPlaying = true;

    wordAudio = new Audio(getPronunciationUrl(word));

    wordAudio.onended = () => {
      isPlaying = false;
    };

    // Edge TTS 失败 → 回退有道
    wordAudio.onerror = () => {
      isPlaying = false;
      const fallback = new Audio(getYoudaoUrl(word));
      fallback.onended = () => {
        isPlaying = false;
      };
      fallback.play().catch(() => {
        isPlaying = false;
      });
      wordAudio = fallback;
    };

    wordAudio.play().catch(() => {
      isPlaying = false;
      const fallback = new Audio(getYoudaoUrl(word));
      fallback.onended = () => {
        isPlaying = false;
      };
      fallback.play().catch(() => {
        isPlaying = false;
      });
      wordAudio = fallback;
    });
  }

  return {
    handlePlayWordSound,
  };
}

// ========== play() ==========

export interface PlayOptions {
  times?: number;
  rate?: number;
  interval?: number;
}

const DefaultPlayOptions = {
  times: 1,
  rate: 1,
  interval: 500,
};

export function play(playOptions?: PlayOptions) {
  const { times, rate, interval } = Object.assign({}, DefaultPlayOptions, playOptions);

  // 如果需要后处理，通过 Web Audio API 连接暖声滤波
  if (needsPostProcessing() && audio.src) {
    playWithPostProcessing(audio.src, { times, rate, interval });
    return () => {
      stopNoiseLayer();
      audio.pause();
      audio.currentTime = 0;
    };
  }

  audio.playbackRate = rate;
  audio.play().catch(() => {
    // 回退到有道
    if (currentText) {
      audio.src = getYoudaoUrl(currentText);
      audio.load();
      audio.play().catch(() => {});
    }
  });

  if (times > 1) {
    audio.addEventListener("ended", handleEnded, false);
  }

  let index = 1;
  let timeoutId: ReturnType<typeof setTimeout>;
  function handleEnded() {
    timeoutId = setTimeout(() => {
      if (index < times) {
        audio.play().catch(() => {});
        index++;
      } else {
        index = 1;
        audio.removeEventListener("ended", handleEnded);
      }
    }, interval);
  }

  return () => {
    audio.pause();
    audio.currentTime = 0;
    audio.removeEventListener("ended", handleEnded);
    timeoutId && clearTimeout(timeoutId);
  };
}

/**
 * 通过 Web Audio API 播放，加暖声滤波 + 低频噪声
 */
async function playWithPostProcessing(
  url: string,
  opts: { times: number; rate: number; interval: number },
) {
  const ctx = getAudioCtx();

  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    let playCount = 0;

    function playOnce() {
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = opts.rate;

      let lastNode: AudioNode = source;

      // 暖声滤波
      const w = voiceSettings.warmth;
      if (w > 0) {
        const cutoff = 20000 - w * 170;
        const lpf = ctx.createBiquadFilter();
        lpf.type = "lowpass";
        lpf.frequency.value = cutoff;
        lpf.Q.value = 0.5;
        lastNode.connect(lpf);
        lastNode = lpf;

        if (w > 30) {
          const bass = ctx.createBiquadFilter();
          bass.type = "lowshelf";
          bass.frequency.value = 200;
          bass.gain.value = w * 0.06;
          lastNode.connect(bass);
          lastNode = bass;
        }
      }

      lastNode.connect(ctx.destination);

      if (playCount === 0) {
        startNoiseLayer(audioBuffer.duration * opts.times);
      }

      source.onended = () => {
        playCount++;
        source.disconnect();
        if (playCount < opts.times) {
          setTimeout(playOnce, opts.interval);
        } else {
          stopNoiseLayer();
        }
      };

      source.start();
    }

    playOnce();
  } catch {
    // 后处理失败，回退普通播放
    audio.play().catch(() => {});
  }
}
