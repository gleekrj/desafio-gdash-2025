import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { CustomThrottlerGuard } from './custom-throttler.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;
  let parentGuard: ThrottlerGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CustomThrottlerGuard],
    }).compile();

    guard = module.get<CustomThrottlerGuard>(CustomThrottlerGuard);
    parentGuard = Object.getPrototypeOf(Object.getPrototypeOf(guard));
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should allow POST /weather/logs without throttling', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/weather/logs',
            path: '/weather/logs',
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should allow POST /weather/logs with query params', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/weather/logs?test=1',
            path: '/weather/logs',
          }),
        }),
      } as ExecutionContext;

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should apply throttling for other POST endpoints', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/other/endpoint',
            path: '/other/endpoint',
          }),
        }),
      } as ExecutionContext;

      // Mock do método canActivate do parent
      jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });

    it('should apply throttling for GET requests', async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/weather/logs',
            path: '/weather/logs',
          }),
        }),
      } as ExecutionContext;

      jest.spyOn(ThrottlerGuard.prototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);
      expect(result).toBe(true);
    });
  });
});

