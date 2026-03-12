import { Module } from "@nestjs/common";

import { ToolController } from "./tool.controller";
import { ToolService } from "./tool.service";
import { TtsService } from "./tts.service";

@Module({
  controllers: [ToolController],
  providers: [ToolService, TtsService],
})
export class ToolModule {}
