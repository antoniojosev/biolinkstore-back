export class User {
  id: string;
  email: string;
  passwordHash: string | null;
  name: string | null;
  avatar: string | null;
  emailVerified: Date | null;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
