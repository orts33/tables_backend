import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as process from 'process';

async function bootstrap() {
  const useHttps = process.env.USE_HTTPS === 'true';
  const sslKeyPath = process.env.SSL_KEY_PATH;
  const sslCertPath = process.env.SSL_CERT_PATH;

  let app;

  if (useHttps && fs.existsSync(sslKeyPath) && fs.existsSync(sslCertPath)) {
    const httpsOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath),
    };
    app = await NestFactory.create(AppModule, { httpsOptions });
    console.log('✅ Запущен в режиме HTTPS');
  } else {
    app = await NestFactory.create(AppModule);
    console.log('⚠️ Запущен в режиме HTTP');
  }

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  const config = new DocumentBuilder()
      .setTitle('API системы столов')
      .setDescription('API для управления столами и участниками')
      .setVersion('1.0')
      .addTag('tables', 'Операции со столами')
      .addTag('participants', 'Операции с участниками')
      .addBearerAuth() // ✅ Добавить поддержку токена
      .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      persistAuthorization: true, // ✅ Сохраняет токен при обновлении страницы
    },
  });

  await app.listen(3000);
}
bootstrap();
