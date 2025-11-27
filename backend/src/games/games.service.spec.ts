import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { GamesService } from './games.service';
import { LoggerService } from '../common/logger/logger.service';
import { of, throwError } from 'rxjs';

// Mock do getConfig
jest.mock('../config/configuration', () => ({
  getConfig: jest.fn(() => ({
    RAWG_KEY: 'test-key',
  })),
}));

describe('GamesService', () => {
  let service: GamesService;
  let httpService: HttpService;

  const mockHttpService = {
    get: jest.fn(),
  };

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamesService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<GamesService>(GamesService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getGames', () => {
    it('should return games list', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: 'Test Game' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getGames(1, 20);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('page');
    });

    it('should filter by platform', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: 'Test Game' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getGames(1, 20, 187);

      expect(httpService.get).toHaveBeenCalled();
      const callArgs = mockHttpService.get.mock.calls[0][1];
      expect(callArgs.params.platforms).toBe(187);
    });

    it('should search games', async () => {
      const mockResponse = {
        data: {
          results: [{ id: 1, name: 'Test Game' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      await service.getGames(1, 20, undefined, 'test');

      expect(httpService.get).toHaveBeenCalled();
      const callArgs = mockHttpService.get.mock.calls[0][1];
      expect(callArgs.params.search).toBe('test');
    });
  });

  describe('getGameById', () => {
    it('should return game by id', async () => {
      const mockGame = { id: 1, name: 'Test Game' };
      mockHttpService.get.mockReturnValue(of({ data: mockGame }));

      const result = await service.getGameById(1);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toEqual(mockGame);
    });
  });

  describe('getAvailablePlatforms', () => {
    it('should return available platforms', () => {
      const platforms = service.getAvailablePlatforms();
      expect(platforms).toContain('PS5');
      expect(platforms).toContain('Xbox');
      expect(platforms).toContain('Switch');
      expect(platforms).toContain('PC');
    });
  });
});

