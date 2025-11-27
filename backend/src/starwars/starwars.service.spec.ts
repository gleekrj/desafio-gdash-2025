import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { StarWarsService } from './starwars.service';
import { LoggerService } from '../common/logger/logger.service';
import { of } from 'rxjs';

describe('StarWarsService', () => {
  let service: StarWarsService;
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
        StarWarsService,
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

    service = module.get<StarWarsService>(StarWarsService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPeople', () => {
    it('should return people list without search', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'Luke Skywalker', height: '172' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPeople(1, 10);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });

    it('should return people list with search', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'Luke Skywalker', height: '172' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPeople(1, 10, 'luke');

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
    });
  });

  describe('getPlanets', () => {
    it('should return planets list', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'Tatooine', population: '200000' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPlanets(1, 10);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
    });
  });

  describe('getStarships', () => {
    it('should return starships list', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'Millennium Falcon', model: 'YT-1300' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getStarships(1, 10);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('data');
    });
  });
});

