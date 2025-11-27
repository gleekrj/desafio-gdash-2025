import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

/**
 * Serviço para gerenciamento de usuários
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Cria um novo usuário com senha hasheada
   *
   * @param createUserDto - Dados do usuário a ser criado
   * @returns Usuário criado (sem senha)
   * @throws HttpException se o email já estiver em uso
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se email já existe
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new HttpException('Email já está em uso', HttpStatus.CONFLICT);
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    console.log('[backend][users] Creating user:', createUserDto.email);
    const savedUser = await user.save();
    
    // Remover senha do retorno
    const userObj = savedUser.toObject();
    delete userObj.password;
    return userObj as User;
  }

  /**
   * Busca todos os usuários
   *
   * @returns Array de usuários (sem senhas)
   */
  async findAll(): Promise<User[]> {
    console.log('[backend][users] Fetching all users');
    const users = await this.userModel.find().exec();
    // Remover senhas do retorno
    return users.map(user => {
      const userObj = user.toObject();
      delete userObj.password;
      return userObj as User;
    });
  }

  /**
   * Conta o total de usuários no sistema
   *
   * @returns Número total de usuários
   */
  async count(): Promise<number> {
    return this.userModel.countDocuments().exec();
  }

  /**
   * Conta o número de administradores no sistema
   *
   * @returns Número de usuários com role 'admin'
   */
  async countAdmins(): Promise<number> {
    return this.userModel.countDocuments({ role: 'admin' }).exec();
  }

  /**
   * Busca um usuário por ID
   *
   * @param id - ID do usuário
   * @returns Usuário encontrado (sem senha)
   * @throws HttpException se o usuário não for encontrado
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }
    const userObj = user.toObject();
    delete userObj.password;
    return userObj as User;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Verificar se está tentando alterar o role do último admin
    if (user.role === 'admin' && updateUserDto.role && updateUserDto.role !== 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new HttpException(
          'Não é possível alterar a função do último administrador. Deve haver pelo menos um usuário admin.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    // UpdateUserDto não contém password - senha é alterada separadamente via changePassword
    const updateData = { ...updateUserDto };

    console.log('[backend][users] Updating user:', id);
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    const userObj = updatedUser.toObject();
    delete userObj.password;
    return userObj as User;
  }

  async changePassword(id: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(changePasswordDto.password, 10);

    console.log('[backend][users] Changing password for user:', id);
    await this.userModel.findByIdAndUpdate(id, { password: hashedPassword }).exec();
  }

  async remove(id: string): Promise<void> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    // Verificar se é o último admin
    if (user.role === 'admin') {
      const adminCount = await this.countAdmins();
      if (adminCount <= 1) {
        throw new HttpException(
          'Não é possível excluir o último administrador do sistema. Deve haver pelo menos um usuário admin.',
          HttpStatus.BAD_REQUEST
        );
      }
    }

    console.log('[backend][users] Deleting user:', id);
    await this.userModel.findByIdAndDelete(id).exec();
  }
}

