import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { WeatherExportService } from './weather-export.service';
import { WeatherLog, WeatherLogDocument } from '../schemas/weather-log.schema';
import { Model, Connection } from 'mongoose';
import { DatabaseConnectionException } from '../../common/exceptions/database-connection.exception';

describe('WeatherExportService', () => {
  let service: WeatherExportService;
  let model: Model<WeatherLogDocument>;
  let connection: Connection;

  const mockWeatherLogModel = {
    find: jest.fn(),
  };

  const mockConnection = {
    readyState: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherExportService,
        {
          provide: getModelToken(WeatherLog.name),
          useValue: mockWeatherLogModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<WeatherExportService>(WeatherExportService);
    model = module.get<Model<WeatherLogDocument>>(getModelToken(WeatherLog.name));
    connection = module.get<Connection>(getConnectionToken());

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exportCsv', () => {
    it('should export logs as CSV', async () => {
      const mockLogs = [
        {
          timestamp: '2025-01-24T10:00:00Z',
          temperature: 25.5,
          humidity: 70,
          city: 'São Paulo',
        },
        {
          timestamp: '2025-01-24T11:00:00Z',
          temperature: 26.0,
          humidity: 65,
          city: 'Rio de Janeiro',
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockLogs),
      };

      mockWeatherLogModel.find.mockReturnValue(mockQuery);
      mockConnection.readyState = 1;

      const result = await service.exportCsv();

      expect(result).toContain('timestamp,temperature,humidity,city');
      expect(result).toContain('2025-01-24T10:00:00Z');
      expect(result).toContain('25.5');
      expect(result).toContain('São Paulo');
    });

    it('should escape special characters in CSV', async () => {
      const mockLogs = [
        {
          timestamp: '2025-01-24T10:00:00Z',
          temperature: 25.5,
          humidity: 70,
          city: 'São Paulo, SP',
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockLogs),
      };

      mockWeatherLogModel.find.mockReturnValue(mockQuery);
      mockConnection.readyState = 1;

      const result = await service.exportCsv();

      expect(result).toContain('"São Paulo, SP"');
    });

    it('should throw DatabaseConnectionException when not connected', async () => {
      mockConnection.readyState = 0;

      await expect(service.exportCsv()).rejects.toThrow(DatabaseConnectionException);
    });
  });

  describe('exportXlsx', () => {
    it('should export logs as XLSX workbook', async () => {
      const mockLogs = [
        {
          timestamp: '2025-01-24T10:00:00Z',
          temperature: 25.5,
          humidity: 70,
          city: 'São Paulo',
        },
      ];

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockLogs),
      };

      mockWeatherLogModel.find.mockReturnValue(mockQuery);
      mockConnection.readyState = 1;

      const result = await service.exportXlsx();

      expect(result).toBeDefined();
      expect(result.worksheets).toBeDefined();
      expect(result.worksheets.length).toBe(1);
      expect(result.worksheets[0].name).toBe('Weather Logs');
    });

    it('should throw DatabaseConnectionException when not connected', async () => {
      mockConnection.readyState = 0;

      await expect(service.exportXlsx()).rejects.toThrow(DatabaseConnectionException);
    });
  });
});

