// Phase 2 — Identity State Machine: error codes
// Determinístico. Toda server fn de Fase 2 retorna um destes códigos em falha.
// Frontend mapeia código → ação de UI (redirect, retry, mensagem).

export const PHASE2_ERROR_CODES = {
  // 401 — token ausente ou inválido (já tratado pelo requireSupabaseAuth)
  UNAUTHORIZED: "UNAUTHORIZED",

  // 403 — token válido mas estado de identidade não permite a operação
  EMAIL_NOT_CONFIRMED: "EMAIL_NOT_CONFIRMED", // estado S1: precisa confirmar email
  PROFILE_REQUIRED: "PROFILE_REQUIRED",       // estado S2: precisa criar profile (onboarding)
  PROFILE_ALREADY_EXISTS: "PROFILE_ALREADY_EXISTS", // estado S3: tentou recriar profile
  WRONG_PROFILE_ROLE: "WRONG_PROFILE_ROLE",   // tem profile de outro tipo (nutri vs patient)

  // 409 — conflito de domínio
  REFERRAL_INVALID: "REFERRAL_INVALID",       // código inexistente, expirado, revogado ou já consumido
  REFERRAL_RACE_LOST: "REFERRAL_RACE_LOST",   // perdeu a corrida atômica (subset semântico de INVALID)

  // 422 — validação de entrada
  VALIDATION_FAILED: "VALIDATION_FAILED",
} as const;

export type Phase2ErrorCode =
  (typeof PHASE2_ERROR_CODES)[keyof typeof PHASE2_ERROR_CODES];

export class Phase2Error extends Error {
  readonly code: Phase2ErrorCode;
  readonly httpStatus: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: Phase2ErrorCode,
    message: string,
    httpStatus: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "Phase2Error";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  toJSON() {
    return {
      __phase2Error: true,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      details: this.details,
    };
  }
}

export function isPhase2Error(e: unknown): e is Phase2Error {
  return e instanceof Phase2Error;
}

// Constructors — uso direto nas server fns
export const Phase2Errors = {
  emailNotConfirmed: () =>
    new Phase2Error(
      PHASE2_ERROR_CODES.EMAIL_NOT_CONFIRMED,
      "Email confirmation required before this operation.",
      403,
    ),
  profileRequired: () =>
    new Phase2Error(
      PHASE2_ERROR_CODES.PROFILE_REQUIRED,
      "User profile must be created before this operation.",
      403,
    ),
  profileAlreadyExists: (role: "nutritionist" | "patient") =>
    new Phase2Error(
      PHASE2_ERROR_CODES.PROFILE_ALREADY_EXISTS,
      `Profile already exists for this user (${role}).`,
      409,
      { role },
    ),
  wrongProfileRole: (expected: "nutritionist" | "patient", actual: "nutritionist" | "patient") =>
    new Phase2Error(
      PHASE2_ERROR_CODES.WRONG_PROFILE_ROLE,
      `Expected ${expected} profile, found ${actual}.`,
      403,
      { expected, actual },
    ),
  referralInvalid: (reason?: string) =>
    new Phase2Error(
      PHASE2_ERROR_CODES.REFERRAL_INVALID,
      reason ?? "Referral code is invalid, expired, revoked, or already consumed.",
      409,
    ),
  validationFailed: (details: Record<string, unknown>) =>
    new Phase2Error(
      PHASE2_ERROR_CODES.VALIDATION_FAILED,
      "Validation failed.",
      422,
      details,
    ),
};
