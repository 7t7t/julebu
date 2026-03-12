import { useRuntimeConfig } from "nuxt/app";
import { reactive, ref } from "vue";

/**
 * CET-6 听力发音系统
 *
 * 优先使用后端 Edge TTS 服务，支持高级 SSML 调参
 * 回退到有道 Web API
 */

export enum PronunciationType {
  American = "American",
  British = "British",
}

export const pronunciationLabels: { [key in PronunciationType]: string } = {
  [PronunciationType.American]: "美音",
  [PronunciationType.British]: "英音",
};

export enum VoiceGender {
  Male = "male",
  Female = "female",
}

export const voiceGenderLabels: { [key in VoiceGender]: string } = {
  [VoiceGender.Male]: "男声",
  [VoiceGender.Female]: "女声",
};

/** 高级语音参数 */
export interface VoiceSettings {
  gender: VoiceGender;
  rate: string;
  pitch: string;
  volume: string;
  style: string;
  styleDegree: string;
  emphasis: string;
  contour: string;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  gender: VoiceGender.Male,
  rate: "-8%",
  pitch: "+32Hz",
  volume: "+5%",
  style: "",
  styleDegree: "1.0",
  emphasis: "",
  contour: "",
};

const PRONUNCIATION_TYPE = "pronunciationType";
const VOICE_GENDER = "voiceGender";
const VOICE_SETTINGS_KEY = "voiceSettings";

const pronunciation = ref<PronunciationType>(PronunciationType.American);
const voiceGender = ref<VoiceGender>(VoiceGender.Male);
const voiceSettings = reactive<VoiceSettings>({ ...DEFAULT_VOICE_SETTINGS });

export function usePronunciation() {
  loadCache();

  function loadCache() {
    const type = getStore() || pronunciation.value;
    setStore(type);
    const gender = (localStorage.getItem(VOICE_GENDER) as VoiceGender) || voiceGender.value;
    setVoiceGender(gender);
    loadVoiceSettings();
  }

  function setStore(value: PronunciationType) {
    pronunciation.value = value;
    localStorage.setItem(PRONUNCIATION_TYPE, value);
  }

  function getStore(): PronunciationType {
    return localStorage.getItem(PRONUNCIATION_TYPE) as PronunciationType;
  }

  function setVoiceGender(value: VoiceGender) {
    voiceGender.value = value;
    localStorage.setItem(VOICE_GENDER, value);
  }

  function loadVoiceSettings() {
    try {
      const saved = localStorage.getItem(VOICE_SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<VoiceSettings>;
        Object.assign(voiceSettings, { ...DEFAULT_VOICE_SETTINGS, ...parsed });
        voiceGender.value = voiceSettings.gender;
      }
    } catch {
      // ignore
    }
  }

  function saveVoiceSettings(settings: Partial<VoiceSettings>) {
    Object.assign(voiceSettings, settings);
    voiceSettings.gender = voiceGender.value;
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
  }

  function getPronunciationType(): number {
    return pronunciation.value === PronunciationType.American ? 2 : 1;
  }

  function getPronunciationOptions() {
    return Object.entries(pronunciationLabels).map(([key, value]) => ({
      label: value,
      value: key,
    }));
  }

  function getVoiceGenderOptions() {
    return Object.entries(voiceGenderLabels).map(([key, value]) => ({
      label: value,
      value: key,
    }));
  }

  /**
   * 构建带全部参数的 TTS URL
   */
  function buildFullTtsUrl(text: string): string {
    const backendUrl = getBackendEndpoint();
    if (!backendUrl || !text) return "";

    const params = new URLSearchParams({ text });
    params.set("voice", voiceSettings.gender);

    // 只传有值的参数
    if (voiceSettings.rate && voiceSettings.rate !== "default")
      params.set("rate", voiceSettings.rate);
    if (voiceSettings.pitch && voiceSettings.pitch !== "default")
      params.set("pitch", voiceSettings.pitch);
    if (voiceSettings.volume && voiceSettings.volume !== "+0%")
      params.set("volume", voiceSettings.volume);
    if (voiceSettings.style) params.set("style", voiceSettings.style);
    if (voiceSettings.styleDegree && voiceSettings.styleDegree !== "1.0")
      params.set("styleDegree", voiceSettings.styleDegree);
    if (voiceSettings.emphasis) params.set("emphasis", voiceSettings.emphasis);
    if (voiceSettings.contour) params.set("contour", voiceSettings.contour);

    return `${backendUrl}tool/tts?${params.toString()}`;
  }

  /**
   * 获取发音 URL — 课程中使用，自动带上已保存的全局设置
   */
  function getPronunciationUrl(english: string | undefined): string {
    if (!english) return "";

    const backendUrl = getBackendEndpoint();
    if (backendUrl) {
      return buildFullTtsUrl(english);
    }

    // 回退到有道
    return `https://dict.youdao.com/dictvoice?type=${getPronunciationType()}&audio=${encodeURIComponent(english)}`;
  }

  /**
   * 构建自定义 TTS URL（试听调参用，临时参数不影响全局设置）
   */
  function buildTtsUrl(
    text: string,
    options: {
      voice?: string;
      rate?: string;
      pitch?: string;
      volume?: string;
      style?: string;
      styleDegree?: string;
      emphasis?: string;
      contour?: string;
    } = {},
  ): string {
    const backendUrl = getBackendEndpoint();
    if (!backendUrl || !text) return "";
    const params = new URLSearchParams({ text });
    params.set("voice", options.voice || voiceGender.value);
    if (options.rate) params.set("rate", options.rate);
    if (options.pitch) params.set("pitch", options.pitch);
    if (options.volume) params.set("volume", options.volume);
    if (options.style) params.set("style", options.style);
    if (options.styleDegree) params.set("styleDegree", options.styleDegree);
    if (options.emphasis) params.set("emphasis", options.emphasis);
    if (options.contour) params.set("contour", options.contour);
    return `${backendUrl}tool/tts?${params.toString()}`;
  }

  /**
   * 获取有道发音 URL（作为回退）
   */
  function getYoudaoUrl(english: string): string {
    return `https://dict.youdao.com/dictvoice?type=${getPronunciationType()}&audio=${encodeURIComponent(english)}`;
  }

  // 切换口音
  function togglePronunciation(type: PronunciationType) {
    if (type !== pronunciation.value) setStore(type);
  }

  // 切换男/女声
  function toggleVoiceGender(gender: VoiceGender) {
    if (gender !== voiceGender.value) {
      setVoiceGender(gender);
      voiceSettings.gender = gender;
      localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(voiceSettings));
    }
  }

  return {
    pronunciation,
    voiceGender,
    voiceSettings,
    DEFAULT_VOICE_SETTINGS,
    getPronunciationOptions,
    getVoiceGenderOptions,
    getPronunciationUrl,
    getYoudaoUrl,
    buildTtsUrl,
    buildFullTtsUrl,
    saveVoiceSettings,
    togglePronunciation,
    toggleVoiceGender,
  };
}

function getBackendEndpoint(): string {
  try {
    const config = useRuntimeConfig();
    return (config.public.backendEndpoint as string) || "";
  } catch {
    // 在非 Nuxt 上下文中回退
    return "http://localhost:3001/";
  }
}
