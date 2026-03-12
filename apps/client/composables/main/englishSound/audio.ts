import { usePronunciation } from "~/composables/user/pronunciation";

/**
 * CET-6 听力标准男声音频播放模块
 *
 * 使用后端 Edge TTS 服务 (en-US-GuyNeural) 生成的音频
 * 自动缓存、错误回退到有道 API
 */

const { getPronunciationUrl, getYoudaoUrl } = usePronunciation();

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
