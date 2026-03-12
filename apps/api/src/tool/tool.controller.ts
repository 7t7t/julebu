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
    @Res() res: Response,
  ) {
    if (!text || text.length > 2000) {
      res.status(400).json({ message: "text is required and must be under 2000 chars" });
      return;
    }

    try {
      const audio = await this.ttsService.synthesize(text, {
        gender: voice === "female" ? "female" : "male",
        rate: rate || undefined,
        pitch: pitch || undefined,
        volume: volume || undefined,
        style: style || undefined,
        styleDegree: styleDegree || undefined,
        role: role || undefined,
        emphasis: emphasis || undefined,
        contour: contour || undefined,
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
