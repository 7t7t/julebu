import { Controller, Get, Query, Res } from "@nestjs/common";
import { ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

import { ToolService } from "./tool.service";
import { TtsService } from "./tts.service";

@ApiTags("Tool")
@Controller("tool")
export class ToolController {
  constructor(
    private readonly toolService: ToolService,
    private readonly ttsService: TtsService,
  ) {}

  @ApiOperation({
    summary: "生成课程打卡图",
  })
  @Get("dailySentence")
  dailySentence() {
    return this.toolService.dailySentence();
  }

  @ApiOperation({
    summary: "CET-6 TTS (SSML 高级调参: 风格/强调/轮廓/角色)",
  })
  @ApiQuery({ name: "text", required: true })
  @ApiQuery({ name: "voice", required: false, description: "male | female" })
  @ApiQuery({ name: "rate", required: false, description: "语速: -50% ~ +100%" })
  @ApiQuery({ name: "pitch", required: false, description: "音调: -50Hz ~ +50Hz 或百分比" })
  @ApiQuery({ name: "volume", required: false, description: "音量: -50% ~ +50%" })
  @ApiQuery({ name: "style", required: false, description: "风格: newscast, calm, cheerful..." })
  @ApiQuery({ name: "styleDegree", required: false, description: "风格强度: 0.01 ~ 2.0" })
  @ApiQuery({ name: "role", required: false, description: "角色: YoungAdultMale, SeniorMale..." })
  @ApiQuery({
    name: "emphasis",
    required: false,
    description: "强调: strong, moderate, reduced, none",
  })
  @ApiQuery({ name: "contour", required: false, description: "音调轮廓(抑扬顿挫)" })
  @ApiQuery({
    name: "voiceName",
    required: false,
    description: "具体声音名: en-US-DavisNeural, en-US-AndrewNeural...",
  })
  @ApiQuery({ name: "naturalPause", required: false, description: "自然停顿: true(默认)/false" })
  @ApiQuery({
    name: "sentenceBreak",
    required: false,
    description: "句间停顿: 500ms(默认), 300ms~1000ms",
  })
  @ApiQuery({
    name: "clauseBreak",
    required: false,
    description: "从句停顿: 200ms(默认), 100ms~500ms",
  })
  @Get("tts")
  async tts(
    @Query("text") text: string,
    @Query("voice") voice: string,
    @Query("rate") rate: string,
    @Query("pitch") pitch: string,
    @Query("volume") volume: string,
    @Query("style") style: string,
    @Query("styleDegree") styleDegree: string,
    @Query("role") role: string,
    @Query("emphasis") emphasis: string,
    @Query("contour") contour: string,
    @Query("voiceName") voiceName: string,
    @Query("naturalPause") naturalPause: string,
    @Query("sentenceBreak") sentenceBreak: string,
    @Query("clauseBreak") clauseBreak: string,
    @Res() res: Response,
  ) {
    if (!text || text.length > 2000) {
      res.status(400).json({ message: "text is required and must be under 2000 chars" });
      return;
    }

    try {
      const audio = await this.ttsService.synthesize(text, {
        gender: voice === "female" ? "female" : "male",
        voiceName: voiceName || undefined,
        rate: rate || undefined,
        pitch: pitch || undefined,
        volume: volume || undefined,
        style: style || undefined,
        styleDegree: styleDegree || undefined,
        role: role || undefined,
        emphasis: emphasis || undefined,
        contour: contour || undefined,
        naturalPause: naturalPause === "false" ? false : true,
        sentenceBreak: sentenceBreak || undefined,
        clauseBreak: clauseBreak || undefined,
      });
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": audio.length.toString(),
        "Cache-Control": "public, max-age=86400",
      });
      res.send(audio);
    } catch (e) {
      res.status(500).json({ message: "TTS generation failed" });
    }
  }
}
