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
  rate?: string; // 语速: "-50%" ~ "+100%"
  pitch?: string; // 音调: "-50Hz" ~ "+50Hz" 或百分比
  volume?: string; // 音量: "-50%" ~ "+50%"
  style?: string; // 说话风格: newscast, calm, cheerful...
  styleDegree?: string; // 风格强度: "0.01" ~ "2.0"
  role?: string; // 角色: YoungAdultMale, SeniorMale...
  emphasis?: string; // 强调: strong, moderate, reduced, none
  contour?: string; // 音调轮廓 (抑扬顿挫): "(0%,+20Hz)(25%,+10Hz)(75%,-10Hz)(100%,-20Hz)"
}

const VOICE_CONFIG: Record<VoiceGender, { voice: string; defaultPitch: string }> = {
  male: { voice: "en-US-GuyNeural", defaultPitch: "+32Hz" },
  female: { voice: "en-US-JennyNeural", defaultPitch: "+0%" },
};

// en-US-GuyNeural 支持的说话风格
export const AVAILABLE_STYLES = [
  "newscast", // 新闻播报 — 最接近 CET-6 听力
  "angry", // 愤怒
  "cheerful", // 愉快
  "sad", // 悲伤
  "excited", // 兴奋
  "friendly", // 友好
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

  private buildSsml(text: string, options: TtsOptions): string {
    const gender = options.gender || "male";
    const config = VOICE_CONFIG[gender];
    const rate = options.rate || "-8%";
    const pitch = options.pitch || config.defaultPitch;
    const volume = options.volume || "+0%";
    const style = options.style || "";
    const styleDegree = options.styleDegree || "1.0";
    const role = options.role || "";
    const emphasis = options.emphasis || "";
    const contour = options.contour || "";

    const escapedText = escapeXml(text);

    // 构建 prosody 属性 (Edge TTS readaloud API 不支持 contour，忽略)
    const prosodyAttrs = `rate="${rate}" pitch="${pitch}" volume="${volume}"`;

    // Edge TTS readaloud API 只支持 prosody 标签
    // express-as (style), emphasis, contour 均不支持
    const content = `<prosody ${prosodyAttrs}>${escapedText}</prosody>`;

    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
      <voice name="${config.voice}">
        ${content}
      </voice>
    </speak>`;
  }

  private async generateAudio(text: string, options: TtsOptions): Promise<Buffer> {
    const tmpFile = path.join(
      os.tmpdir(),
      `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`,
    );
    const ssml = this.buildSsml(text, options);

    try {
      await this.sendSsmlToEdgeTts(ssml, tmpFile);
      const audio = fs.readFileSync(tmpFile);
      if (audio.length > 0) return audio;
      throw new Error("Empty audio");
    } catch (err) {
      this.logger.warn(`SSML TTS failed (${err.message}), retrying without style/emphasis...`);
      // 回退：去掉 style/emphasis，只用基础 prosody
      try {
        this.cleanTmpFile(tmpFile);
        const fallbackSsml = this.buildSsml(text, {
          ...options,
          style: undefined,
          styleDegree: undefined,
          role: undefined,
          emphasis: undefined,
        });
        await this.sendSsmlToEdgeTts(fallbackSsml, tmpFile);
        const audio = fs.readFileSync(tmpFile);
        if (audio.length > 0) return audio;
        throw new Error("Fallback also empty");
      } catch (fallbackErr) {
        this.logger.error(`TTS fallback also failed: ${fallbackErr.message}`);
        throw fallbackErr;
      }
    } finally {
      this.cleanTmpFile(tmpFile);
    }
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
        }, 15000);

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
      } catch (err) {
        reject(err);
      }
    });
  }
}
