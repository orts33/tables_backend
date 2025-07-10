import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true, // если используешь куки или авторизацию
  });

  const config = new DocumentBuilder()
      .setTitle('API системы столов')
      .setDescription('API для управления столами и участниками')
      .setVersion('1.0')
      .addTag('tables', 'Операции со столами')
      .addTag('participants', 'Операции с участниками')
      .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  await app.listen(3000);
}
bootstrap();
