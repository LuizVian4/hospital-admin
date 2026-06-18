import { createHash, randomBytes } from 'node:crypto';
import { eq, and, isNull, gt } from 'drizzle-orm';
import type { FastifyReply, FastifyInstance } from 'fastify';
import { db } from '../db';
import { refreshTokens, users } from '../db/schema';
import type { JwtPayload } from '../plugins/auth';
import type { User } from '@escala/shared';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

function cookieBaseOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  const options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax' | 'none';
    path: string;
    domain?: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    // Frontend e API em hosts diferentes (ex.: *.up.railway.app) exigem None + Secure.
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };

  const domain = process.env.COOKIE_DOMAIN?.trim();
  if (domain) {
    options.domain = domain;
  }

  return options;
}

export function parseDurationSeconds(value: string, fallbackSeconds: number): number {
  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackSeconds;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 3600;
    case 'd':
      return amount * 86400;
    default:
      return fallbackSeconds;
  }
}

export function getAccessTokenTtl(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN || '15m';
}

export function getRefreshTokenTtlSeconds(): number {
  return parseDurationSeconds(process.env.JWT_REFRESH_EXPIRES_IN || '7d', 7 * 86400);
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString('hex');
}

export function toPublicUser(user: typeof users.$inferSelect): User {
  return {
    id: user.id,
    email: user.email,
    nome: user.nome,
    ativo: user.ativo,
  };
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export async function issueSession(
  app: FastifyInstance,
  reply: FastifyReply,
  user: typeof users.$inferSelect
): Promise<SessionTokens> {
  const accessToken = await reply.jwtSign(
    { sub: user.id, email: user.email } satisfies JwtPayload,
    { expiresIn: getAccessTokenTtl() }
  );

  const refreshToken = generateRefreshToken();
  const refreshTtlSeconds = getRefreshTokenTtlSeconds();
  const expiresAt = new Date(Date.now() + refreshTtlSeconds * 1000);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt,
  });

  const cookieOptions = cookieBaseOptions();
  const accessMaxAge = parseDurationSeconds(getAccessTokenTtl(), 15 * 60);

  reply.setCookie(ACCESS_COOKIE, accessToken, {
    ...cookieOptions,
    maxAge: accessMaxAge,
  });

  reply.setCookie(REFRESH_COOKIE, refreshToken, {
    ...cookieOptions,
    maxAge: refreshTtlSeconds,
  });

  return { accessToken, refreshToken };
}

export function clearAuthCookies(reply: FastifyReply) {
  const cookieOptions = cookieBaseOptions();
  reply.clearCookie(ACCESS_COOKIE, cookieOptions);
  reply.clearCookie(REFRESH_COOKIE, cookieOptions);
}

export async function revokeRefreshToken(token: string | undefined) {
  if (!token) return;
  const tokenHash = hashRefreshToken(token);
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, tokenHash), isNull(refreshTokens.revokedAt)));
}

export async function rotateRefreshSession(
  app: FastifyInstance,
  reply: FastifyReply,
  refreshToken: string
): Promise<{ user: typeof users.$inferSelect; tokens: SessionTokens } | null> {
  const tokenHash = hashRefreshToken(refreshToken);
  const now = new Date();

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!stored) {
    return null;
  }

  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(eq(refreshTokens.id, stored.id));

  const [user] = await db.select().from(users).where(eq(users.id, stored.userId)).limit(1);
  if (!user || !user.ativo) {
    return null;
  }

  const tokens = await issueSession(app, reply, user);
  return { user, tokens };
}
