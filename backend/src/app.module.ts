import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { WeatherModule } from './weather/weather.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from './common/logger/logger.module';
import { PokemonModule } from './pokemon/pokemon.module';
import { StarWarsModule } from './starwars/starwars.module';
import { GamesModule } from './games/games.module';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';

// Priorizar process.env.MONGO_URI se fornecido
// Se não fornecido, usar padrão baseado no ambiente
const isDocker =
  !!process.env.DOCKER_CONTAINER ||
  process.env.MONGO_URI?.includes('mongo:') ||
  process.env.MONGO_URI?.includes('dg_mongo');

const defaultMongoUri = isDocker
  ? 'mongodb://mongo:27017/gdash'
  : 'mongodb://localhost:27017/gdash';

// process.env.MONGO_URI tem prioridade
const mongoUri = process.env.MONGO_URI || defaultMongoUri;

console.log('[backend] Environment:', isDocker ? 'Docker' : 'Local');
console.log('[backend] MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***@')); // Ocultar credenciais se houver

@Module({
  imports: [
    LoggerModule,
    // Rate limiting - diferentes limites para autenticado vs não autenticado
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000, // 1 minuto
        limit: 10, // 10 requisições por minuto (não autenticado)
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minuto
        limit: 30, // 30 requisições por minuto (autenticado)
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hora
        limit: 100, // 100 requisições por hora
      },
    ]),
    MongooseModule.forRoot(mongoUri, {
      serverSelectionTimeoutMS: 30000, // Aumentado para 30 segundos
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      retryReads: true,
    }),
    WeatherModule,
    UsersModule,
    AuthModule,
    PokemonModule,
    StarWarsModule,
    GamesModule,
  ],
  controllers: [AppController],
  providers: [
    // Aplicar rate limiting globalmente com guard customizado
    // que ignora o endpoint POST /weather/logs
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}

