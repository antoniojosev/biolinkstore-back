import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/infrastructure/database/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId'),
      clientSecret: configService.get<string>('google.clientSecret'),
      callbackURL: configService.get<string>('google.callbackUrl'),
      scope: ['email', 'profile'],
      passReqToCallback: true, // Required for state parameter for PKCE
      // PKCE is automatically enabled by setting passReqToCallback to true for Google OAuth2Strategy
      // and not providing a state function.
    });
  }

  async validate(
    request: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { name, emails, photos } = profile;
      const email = emails[0].value;
      const avatar = photos[0].value;

      let user = await this.prisma.user.findUnique({ where: { email } });

      if (!user) {
        // If user doesn't exist, create one
        user = await this.prisma.user.create({
          data: {
            email,
            name: name.givenName + ' ' + name.familyName,
            avatar,
            emailVerified: new Date(),
          },
        });
      }

      // Upsert account link for Google
      await this.prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: profile.id,
          },
        },
        update: {
          accessToken,
          refreshToken,
          // expiresAt: profile.expires_in, // Google OAuth2Strategy doesn't provide expires_in directly in profile
          // tokenType: 'Bearer',
        },
        create: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: profile.id,
          accessToken,
          refreshToken,
          // expiresAt: profile.expires_in, // Google OAuth2Strategy doesn't provide expires_in directly in profile
          // tokenType: 'Bearer',
        },
      });

      // Passport will attach this user to the request.user
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  }
}
