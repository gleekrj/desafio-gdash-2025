import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PokemonService } from './pokemon.service';
import { LoggerService } from '../common/logger/logger.service';
import { of, throwError } from 'rxjs';

describe('PokemonService', () => {
  let service: PokemonService;
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
        PokemonService,
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

    service = module.get<PokemonService>(PokemonService);
    httpService = module.get<HttpService>(HttpService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPokemonList', () => {
    it('should return pokemon list without search', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }],
          count: 1,
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPokemonList(1, 20);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('count');
    });

    it('should return pokemon list with search', async () => {
      const mockResponse = {
        data: {
          results: [{ name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' }],
        },
      };
      mockHttpService.get.mockReturnValue(of(mockResponse));

      const result = await service.getPokemonList(1, 20, 'pikachu');

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toHaveProperty('results');
    });
  });

  describe('getPokemonById', () => {
    it('should return pokemon by id', async () => {
      const mockPokemon = {
        id: 25,
        name: 'pikachu',
        height: 4,
        weight: 60,
      };
      mockHttpService.get.mockReturnValue(of({ data: mockPokemon }));

      const result = await service.getPokemonById(25);

      expect(httpService.get).toHaveBeenCalled();
      expect(result).toEqual(mockPokemon);
    });

    it('should throw error when pokemon not found', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('Not found')));

      await expect(service.getPokemonById(99999)).rejects.toThrow();
    });
  });
});

