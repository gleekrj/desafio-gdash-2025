import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getConfig } from './config/configuration';
import mongoose from 'mongoose';

async function bootstrap() {
  console.log('[backend] Starting application...');

  // Validar variáveis de ambiente antes de iniciar
  let config;
  try {
    config = getConfig();
    console.log('[backend] ✅ Environment variables validated successfully');
    console.log(`[backend] Environment: ${config.NODE_ENV || 'development'}`);
  } catch (error) {
    console.error('[backend] ❌ Failed to validate environment variables:');
    console.error(error.message);
    process.exit(1);
  }

  // Configurar listeners de eventos MongoDB
  const mongooseConnection = mongoose.connection;
  
  mongooseConnection.on('connected', () => {
    console.log('[backend] MongoDB connected successfully');
  });
  
  mongooseConnection.on('error', (err) => {
    console.error('[backend] MongoDB connection error:', err.message);
  });

  mongooseConnection.on('disconnected', () => {
    console.warn('[backend] MongoDB disconnected');
  });

  const app = await NestFactory.create(AppModule);

  // Configurar CORS adequadamente
  const frontendUrl = config.FRONTEND_URL || 'http://localhost:5173';
  
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type'],
  });
  
  console.log(`[backend] CORS configured for: ${frontendUrl}`);

  // Aplicar exception filter global
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configurar Swagger/OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GDASH Weather API')
    .setDescription('API para gerenciamento de logs climáticos - Desafio GDASH')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Validação global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`[backend] Application is running on: http://localhost:${port}`);
  console.log(`[backend] Swagger documentation available at: http://localhost:${port}/api`);
  
  // Verificar status da conexão após iniciar
  if (mongooseConnection.readyState === 1) {
    console.log('[backend] MongoDB connection is active');
  } else {
    console.warn('[backend] MongoDB connection status:', mongooseConnection.readyState);
    console.warn('[backend] Connection may still be establishing...');
  }
}

bootstrap().catch((error) => {
  console.error('[backend] Failed to start application:', error.message || error);
  process.exit(1);
});

