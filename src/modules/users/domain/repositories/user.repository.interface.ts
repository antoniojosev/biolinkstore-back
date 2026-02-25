import { User } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}

export interface CreateUserData {
  email: string;
  passwordHash?: string;
  name?: string;
  avatar?: string;
  emailVerified?: Date;
}

export interface UpdateUserData {
  name?: string;
  avatar?: string;
  emailVerified?: Date;
  passwordHash?: string;
}
