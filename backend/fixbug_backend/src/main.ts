import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin:'http://localhost:3001',
    Credential:true
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Fixbug API')
    .setDescription('Documentation de l\'API Fixbug')
    .setVersion('1.0')
    .addBearerAuth() 
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
