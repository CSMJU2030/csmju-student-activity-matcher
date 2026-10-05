import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader, errors as joseErrors, jwtVerify } from 'jose';
import { CoreHubTokenPayload } from './core-hub-identity';
import { JwksService } from './jwks.service';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';

/** The Core Hub contract is immutable (spec §43). */
const REQUIRED_ALGORITHM = 'RS256';

/** Access tokens live 900 s; 60 s of skew is tolerated (auth-contract 1.2 step 9). */
const MAX_TOKEN_LIFETIME_SEC = 900 + 60;

/**
 * Verifies a Core Hub access token (spec §9, §13).
 *
 * 1. require alg = RS256   2. read kid           3. get public key from JWKS
 * 4. verify signature      5. verify iss          6. verify aud
 * 7. verify exp            8. require a subject
 * 9. exp - iat ≤ 900 (+60) s - refuse long-lived (refresh) tokens
 * 10. azp, when present, must be this subsystem
 */
@Injectable()
export class CoreHubTokenVerifier {
  constructor(
    private readonly jwks: JwksService,
    private readonly config: ConfigService,
  ) {}

  async verify(token: string): Promise<CoreHubTokenPayload> {
    if (typeof token !== 'string' || token.trim().length === 0) {
      throw new TokenVerificationError(TokenRejectionReason.MISSING_TOKEN, 'No token supplied');
    }

    // Step 1-2: inspect the (unverified) header only to learn alg and kid.
    let header: ReturnType<typeof decodeProtectedHeader>;
    try {
      header = decodeProtectedHeader(token);
    } catch {
      throw new TokenVerificationError(
        TokenRejectionReason.MALFORMED_TOKEN,
        'Token is not a well-formed JWT',
      );
    }

    // `alg: none`, HS256 and every other algorithm are rejected outright.
    if (header.alg !== REQUIRED_ALGORITHM) {
      throw new TokenVerificationError(
        TokenRejectionReason.UNSUPPORTED_ALGORITHM,
        `Unsupported token algorithm: ${String(header.alg)}`,
        header.kid,
      );
    }

    if (typeof header.kid !== 'string' || header.kid.length === 0) {
      throw new TokenVerificationError(
        TokenRejectionReason.MISSING_KID,
        'Token header does not contain a key id',
      );
    }

    // Step 3: resolve the public key for this kid (refreshing JWKS if needed).
    const key = await this.jwks.getKey(header.kid);

    // Step 4-7: signature + registered claim validation, enforcing RS256 again.
    let payload: CoreHubTokenPayload;
    try {
      const result = await jwtVerify(token, key, {
        algorithms: [REQUIRED_ALGORITHM],
        issuer: this.config.get<string>('coreHub.issuer', 'core-hub'),
        audience: this.config.get<string>('coreHub.audience', 'csmju2030'),
        clockTolerance: this.config.get<number>('coreHub.clockToleranceSec', 5),
      });
      payload = result.payload as unknown as CoreHubTokenPayload;
    } catch (error) {
      throw this.translate(error, header.kid);
    }

    // Step 8: the subsystem also requires a usable subject.
    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
      throw new TokenVerificationError(
        TokenRejectionReason.INVALID_CLAIMS,
        'Token has no subject claim',
        header.kid,
      );
    }

    // Step 9: an access token lives 15 minutes; anything longer (a refresh
    // token, 7 days) must not be accepted in its place.
    if (
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      payload.exp - payload.iat > MAX_TOKEN_LIFETIME_SEC
    ) {
      throw new TokenVerificationError(
        TokenRejectionReason.TOKEN_LIFETIME_EXCEEDED,
        'Token lifetime is longer than an access token may live',
        header.kid,
      );
    }

    // Step 10: a token issued for another subsystem is not valid here.
    const subsystemId = this.config.get<string>('subsystemId', 'csmju-student-activity-matcher');
    if (payload.azp !== undefined && payload.azp !== subsystemId) {
      throw new TokenVerificationError(
        TokenRejectionReason.INVALID_AZP,
        'Token was issued for another subsystem',
        header.kid,
      );
    }

    return payload;
  }

  private translate(error: unknown, kid: string): TokenVerificationError {
    if (error instanceof TokenVerificationError) {
      return error;
    }

    if (error instanceof joseErrors.JWTExpired) {
      return new TokenVerificationError(TokenRejectionReason.EXPIRED, 'Token has expired', kid);
    }

    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      if (error.claim === 'iss') {
        return new TokenVerificationError(
          TokenRejectionReason.INVALID_ISSUER,
          'Token issuer is not the Core Hub',
          kid,
        );
      }
      if (error.claim === 'aud') {
        return new TokenVerificationError(
          TokenRejectionReason.INVALID_AUDIENCE,
          'Token audience does not include this platform',
          kid,
        );
      }
      return new TokenVerificationError(
        TokenRejectionReason.INVALID_CLAIMS,
        `Token claim "${error.claim}" is invalid`,
        kid,
      );
    }

    if (
      error instanceof joseErrors.JOSEError &&
      error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'
    ) {
      return new TokenVerificationError(
        TokenRejectionReason.INVALID_SIGNATURE,
        'Token signature verification failed',
        kid,
      );
    }

    return new TokenVerificationError(
      TokenRejectionReason.MALFORMED_TOKEN,
      'Token could not be verified',
      kid,
    );
  }
}
