import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app/app.module";
import { appGlobalMiddleware } from "./app/useGlobal";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === "prod" || process.env.NODE_ENV === "production";

  app.enableCors({
    origin: isProd
      ? [/^https:\/\/cet\.vralph\.top$/, /^https:\/\/cet-auth\.vralph\.top$/]
      : [/^http:\/\/localhost(:\d+)?$/],
  });

  appGlobalMiddleware(app);

  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle("Alrahim Swagger")
      .setDescription("The Alrahim API description")
      .setVersion("v1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("/swagger", app, document);
  }

  await app.listen(process.env.PORT || 3001);
}

bootstrap();
