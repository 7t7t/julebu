import * as crypto from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { Injectable, Logger } from "@nestjs/common";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocket = require("ws");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  TRUSTED_CLIENT_TOKEN,
  generateSecMsGecToken,
  CHROMIUM_FULL_VERSION,
} = require("node-edge-tts/dist/drm");

/**
 * CET-6 听力 TTS 服务（高级 SSML 版）
 *
 * 支持 Microsoft Edge TTS SSML 高级特性:
 * - 男声/女声切换
 * - 语速、音调、音量基础调节
 * - 说话风格 (style): newscast, calm, cheerful 等
 * - 风格强度 (styleDegree): 0.01 ~ 2.0
 * - 角色扮演 (role): 不同年龄/性别角色
 * - 强调级别 (emphasis): strong, moderate, reduced
 */

export type VoiceGender = "male" | "female";

export interface TtsOptions {
  gender?: VoiceGender;
  voiceName?: string; // 具体声音名称，优先于 gender
  rate?: string; // 语速: "-50%" ~ "+100%"
  pitch?: string; // 音调: "-50Hz" ~ "+50Hz" 或百分比
  volume?: string; // 音量: "-50%" ~ "+50%"
  style?: string; // 说话风格: newscast, calm, cheerful...
  styleDegree?: string; // 风格强度: "0.01" ~ "2.0"
  role?: string; // 角色: YoungAdultMale, SeniorMale...
  emphasis?: string; // 强调: strong, moderate, reduced, none
  contour?: string; // 音调轮廓 (抑扬顿挫): "(0%,+20Hz)(25%,+10Hz)(75%,-10Hz)(100%,-20Hz)"
  naturalPause?: boolean; // 自然停顿：在标点处插入 break 标签
  sentenceBreak?: string; // 句间停顿时长: "500ms", "800ms" 等
  clauseBreak?: string; // 从句停顿时长: "200ms", "350ms" 等
}

const VOICE_CONFIG: Record<VoiceGender, { voice: string; defaultPitch: string }> = {
  male: { voice: "en-US-GuyNeural", defaultPitch: "-4Hz" },
  female: { voice: "en-US-JennyNeural", defaultPitch: "+0Hz" },
};

// Edge TTS 支持的说话风格 (部分声音支持)
export const AVAILABLE_STYLES = [
  "newscast", // 新闻播报 — 最接近 CET-6 听力
  "friendly", // 友好
  "cheerful", // 愉快
  "calm", // 平静
  "excited", // 兴奋
  "sad", // 悲伤
  "angry", // 愤怒
  "terrified", // 恐惧
  "shouting", // 喊叫
  "unfriendly", // 冷漠
  "whispering", // 耳语
  "hopeful", // 期望
];

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&apos;";
      default:
        return c;
    }
  });
}

@Injectable()
export class TtsService {
  private readonly logger = new Logger(TtsService.name);

  // 内存缓存 (最多 500 条)
  private cache = new Map<string, Buffer>();
  private readonly MAX_CACHE = 500;

  async synthesize(text: string, options: TtsOptions = {}): Promise<Buffer> {
    const cacheKey = JSON.stringify({ text, ...options });
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const audioBuffer = await this.generateAudio(text, options);

    // 缓存
    if (this.cache.size >= this.MAX_CACHE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, audioBuffer);

    return audioBuffer;
  }

  /**
   * 在标点处插入 SSML <break> 标签，模拟自然停顿节奏
   * - 句号/问号/感叹号 → 句间停顿 (较长)
   * - 逗号/分号/冒号/破折号 → 从句停顿 (较短)
   */
  private insertNaturalBreaks(text: string, sentenceBreak: string, clauseBreak: string): string {
    return (
      text
        // 句末标点 → 加句间停顿
        .replace(/([.!?])\s+/g, `$1<break time="${sentenceBreak}"/> `)
        // 从句标点 → 加从句停顿
        .replace(/([,;:—–])\s+/g, `$1<break time="${clauseBreak}"/> `)
        // 连字符短语间加微停顿 (如 "well-known fact" → 不处理)
        // 长破折号单独处理
        .replace(/ — /g, ` <break time="${clauseBreak}"/>— `)
    );
  }

  private buildSsml(text: string, options: TtsOptions): string {
    const gender = options.gender || "male";
    const config = VOICE_CONFIG[gender];
    const voiceName = options.voiceName || config.voice;
    const rate = options.rate || "-10%";
    const pitch = options.pitch || config.defaultPitch;
    const volume = options.volume || "+0%";

    const sentenceBreak = options.sentenceBreak || "500ms";
    const clauseBreak = options.clauseBreak || "200ms";

    // 先转义 XML 特殊字符
    let processedText = escapeXml(text);

    // 插入自然停顿 (默认开启，除非显式关闭)
    if (options.naturalPause !== false) {
      processedText = this.insertNaturalBreaks(processedText, sentenceBreak, clauseBreak);
    }

    // 构建 prosody 属性
    const prosodyAttrs = `rate="${rate}" pitch="${pitch}" volume="${volume}"`;

    const content = `<prosody ${prosodyAttrs}>${processedText}</prosody>`;

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${voiceName}">
        ${content}
      </voice>
    </speak>`;
  }

  /**
   * 单次 WebSocket 尝试，带自动重试
   */
  private async trySynthesize(ssml: string, tmpFile: string): Promise<Buffer> {
    await this.sendSsmlToEdgeTts(ssml, tmpFile);
    const audio = fs.readFileSync(tmpFile);
    if (audio.length > 0) return audio;
    throw new Error("Empty audio");
  }

  private async generateAudio(text: string, options: TtsOptions): Promise<Buffer> {
    const tmpFile = path.join(
      os.tmpdir(),
      `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`,
    );

    // 回退链: 完整SSML → 去break标签 → 纯prosody → 延时重试纯prosody
    const fallbackChain: Array<{ label: string; buildOptions: TtsOptions; delay?: number }> = [
      { label: "full SSML", buildOptions: options },
      {
        label: "without breaks",
        buildOptions: { ...options, naturalPause: false },
      },
      {
        label: "plain prosody",
        buildOptions: {
          ...options,
          naturalPause: false,
          style: undefined,
          styleDegree: undefined,
          role: undefined,
          emphasis: undefined,
        },
      },
      {
        label: "plain prosody (retry after delay)",
        buildOptions: {
          ...options,
          naturalPause: false,
          style: undefined,
          styleDegree: undefined,
          role: undefined,
          emphasis: undefined,
        },
        delay: 2000,
      },
    ];

    for (let i = 0; i < fallbackChain.length; i++) {
      const { label, buildOptions, delay } = fallbackChain[i];
      try {
        if (delay) await this.sleep(delay);
        this.cleanTmpFile(tmpFile);
        const ssml = this.buildSsml(text, buildOptions);
        const audio = await this.trySynthesize(ssml, tmpFile);
        if (i > 0) this.logger.log(`TTS succeeded with fallback: ${label}`);
        return audio;
      } catch (err) {
        const isLast = i === fallbackChain.length - 1;
        if (isLast) {
          this.logger.error(`TTS all ${fallbackChain.length} attempts failed: ${err.message}`);
          throw err;
        }
        this.logger.warn(`TTS [${label}] failed (${err.message}), trying next fallback...`);
      }
    }

    throw new Error("TTS generation failed");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private cleanTmpFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
      // ignore
    }
  }

  private sendSsmlToEdgeTts(ssml: string, audioPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsConnect = new WebSocket(
          `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${generateSecMsGecToken()}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`,
          {
            host: "speech.platform.bing.com",
            origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
            headers: {
              Pragma: "no-cache",
              "Cache-Control": "no-cache",
              "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_FULL_VERSION.split(".")[0]}.0.0.0 Safari/537.36 Edg/${CHROMIUM_FULL_VERSION.split(".")[0]}.0.0.0`,
              "Accept-Encoding": "gzip, deflate, br, zstd",
              "Accept-Language": "en-US,en;q=0.9",
            },
          },
        );

        const timeout = setTimeout(() => {
          wsConnect.close();
          reject(new Error("TTS WebSocket timeout"));
        }, 20000);

        wsConnect.on("open", () => {
          // 发送配置
          wsConnect.send(
            `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`,
          );

          // 发送 SSML
          const requestId = crypto.randomBytes(16).toString("hex");
          wsConnect.send(
            `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`,
          );
        });

        const audioStream = fs.createWriteStream(audioPath);

        wsConnect.on("message", (data: any, isBinary: boolean) => {
          if (isBinary) {
            const separator = "Path:audio\r\n";
            const index = data.indexOf(separator) + separator.length;
            const audioData = data.subarray(index);
            audioStream.write(audioData);
          } else {
            const message = data.toString();
            if (message.includes("Path:turn.end")) {
              audioStream.end();
              audioStream.on("finish", () => {
                wsConnect.close();
                clearTimeout(timeout);
                resolve();
              });
            }
          }
        });

        wsConnect.on("error", (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        });

        wsConnect.on("close", (code: number) => {
          clearTimeout(timeout);
          // 非正常关闭 (1000=正常, 1005=无状态码)
          if (code !== 1000 && code !== 1005) {
            reject(new Error(`WebSocket closed unexpectedly: code ${code}`));
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}
