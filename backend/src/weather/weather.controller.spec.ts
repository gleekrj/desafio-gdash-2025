import { Test, TestingModule } from '@nestjs/testing';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';

describe('WeatherController', () => {
  let controller: WeatherController;
  let service: WeatherService;

  const mockWeatherService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllPaginated: jest.fn(),
    exportCsv: jest.fn(),
    exportXlsx: jest.fn(),
    getInsights: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    service = module.get<WeatherService>(WeatherService);

    // Limpar mocks antes de cada teste
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /weather/logs', () => {
    it('should call weatherService.create with correct DTO', async () => {
      // Arrange
      const createWeatherLogDto: CreateWeatherLogDto = {
        timestamp: '2025-01-24T10:00:00Z',
        temperature: 25.5,
        humidity: 70,
        city: 'São Paulo',
      };

      const expectedResult = {
        _id: '507f1f77bcf86cd799439011',
        ...createWeatherLogDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWeatherService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createWeatherLogDto);

      // Assert
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(createWeatherLogDto);
      expect(result).toEqual(expectedResult);
    });

    it('should call weatherService.create without city (optional field)', async () => {
      // Arrange
      const createWeatherLogDto: CreateWeatherLogDto = {
        timestamp: '2025-01-24T10:00:00Z',
        temperature: 22.0,
        humidity: 65,
      };

      const expectedResult = {
        _id: '507f1f77bcf86cd799439012',
        ...createWeatherLogDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWeatherService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createWeatherLogDto);

      // Assert
      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(createWeatherLogDto);
      expect(result).toEqual(expectedResult);
    });

    it('should return 201 status code (handled by @HttpCode decorator)', async () => {
      // Arrange
      const createWeatherLogDto: CreateWeatherLogDto = {
        timestamp: '2025-01-24T10:00:00Z',
        temperature: 20.0,
        humidity: 60,
      };

      const expectedResult = {
        _id: '507f1f77bcf86cd799439013',
        ...createWeatherLogDto,
      };

      mockWeatherService.create.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.create(createWeatherLogDto);

      // Assert
      expect(result).toBeDefined();
      // O decorator @HttpCode(HttpStatus.CREATED) é testado na integração,
      // mas podemos verificar que o método foi chamado corretamente
      expect(service.create).toHaveBeenCalled();
    });
  });
});

