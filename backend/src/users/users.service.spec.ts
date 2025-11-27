import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Model } from 'mongoose';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  // Mock do Model como função construtora
  const MockUserModel: any = jest.fn().mockImplementation((dto) => {
    return {
      ...dto,
      _id: '507f1f77bcf86cd799439011',
      save: jest.fn().mockResolvedValue({
        ...dto,
        _id: '507f1f77bcf86cd799439011',
        toObject: jest.fn().mockReturnValue({
          ...dto,
          _id: '507f1f77bcf86cd799439011',
        }),
      }),
    };
  });

  // Adicionar métodos estáticos ao mock
  MockUserModel.findOne = jest.fn();
  MockUserModel.find = jest.fn();
  MockUserModel.findById = jest.fn();
  MockUserModel.findByIdAndUpdate = jest.fn();
  MockUserModel.findByIdAndDelete = jest.fn();
  MockUserModel.countDocuments = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));

    jest.clearAllMocks();
    jest.restoreAllMocks();
    MockUserModel.findOne.mockClear();
    MockUserModel.find.mockClear();
    MockUserModel.findById.mockClear();
    MockUserModel.findByIdAndUpdate.mockClear();
    MockUserModel.findByIdAndDelete.mockClear();
    MockUserModel.countDocuments.mockClear();
    MockUserModel.mockClear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
      };

      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        _id: '507f1f77bcf86cd799439011',
        ...createUserDto,
        password: hashedPassword,
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439011',
          ...createUserDto,
          password: hashedPassword,
        }),
        save: jest.fn().mockResolvedValue(true),
      };

      MockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.create(createUserDto);

      expect(MockUserModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
    });

    it('should throw HttpException when email already exists', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const existingUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };

      MockUserModel.findOne.mockResolvedValue(existingUser);

      await expect(service.create(createUserDto)).rejects.toThrow(HttpException);
    });
  });

  describe('findAll', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        {
          _id: '1',
          name: 'User 1',
          email: 'user1@example.com',
          role: 'user',
          toObject: jest.fn().mockReturnValue({
            _id: '1',
            name: 'User 1',
            email: 'user1@example.com',
            role: 'user',
            password: 'hashed1',
          }),
        },
        {
          _id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          role: 'admin',
          toObject: jest.fn().mockReturnValue({
            _id: '2',
            name: 'User 2',
            email: 'user2@example.com',
            role: 'admin',
            password: 'hashed2',
          }),
        },
      ];

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockUsers),
      };

      MockUserModel.find.mockReturnValue(mockQuery);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty('password');
      expect(result[1]).not.toHaveProperty('password');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        toObject: jest.fn().mockReturnValue({
          _id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          password: 'hashed',
        }),
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      const result = await service.findOne(userId);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect((result as any)._id).toBe(userId);
    });

    it('should throw HttpException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      await expect(service.findOne(userId)).rejects.toThrow(HttpException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email,
        name: 'Test User',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      MockUserModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByEmail(email);

      expect(MockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const email = 'test@example.com';

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      MockUserModel.findOne.mockReturnValue(mockQuery);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const existingUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      const updatedUser = {
        _id: userId,
        ...updateUserDto,
        email: 'test@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: userId,
          ...updateUserDto,
          email: 'test@example.com',
          password: 'hashed',
        }),
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(existingUser),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      MockUserModel.findByIdAndUpdate.mockReturnValue(mockUpdateQuery);

      const result = await service.update(userId, updateUserDto);

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result.name).toBe(updateUserDto.name);
    });

    it('should update user without password', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const existingUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      const updatedUser = {
        _id: userId,
        ...existingUser,
        name: 'Updated Name',
        toObject: jest.fn().mockReturnValue({
          _id: userId,
          ...existingUser,
          name: 'Updated Name',
        }),
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(existingUser),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue(updatedUser),
      };

      MockUserModel.findByIdAndUpdate.mockReturnValue(mockUpdateQuery);

      const result = await service.update(userId, updateUserDto);

      expect(result).toBeDefined();
      expect(MockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should throw HttpException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(HttpException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userId = '507f1f77bcf86cd799439011';
      const mockUser = {
        _id: userId,
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      const mockDeleteQuery = {
        exec: jest.fn().mockResolvedValue(mockUser),
      };

      MockUserModel.findByIdAndDelete.mockReturnValue(mockDeleteQuery);

      await service.remove(userId);

      expect(MockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
    });

    it('should throw HttpException when user not found', async () => {
      const userId = '507f1f77bcf86cd799439011';

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      MockUserModel.findById.mockReturnValue(mockQuery);

      await expect(service.remove(userId)).rejects.toThrow(HttpException);
    });
  });
});

