import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { UnifiedUserProfile } from '../../../shared/types/userTypes';
import type { VerificationFlow, VerificationType } from '../../../modules/account/api/AccountTypes';

/**
 * authSlice.ts
 * Pending login credentials used ONLY to complete a verification step (email or MFA).
 * Security note:
 * - This is stored only in Redux memory (NOT persisted to localStorage).
 * - Cleared on success, cancel, logout, or failure where appropriate.
 */
export interface PendingLogin {
  email: string;
  password: string;
  remember_me?: boolean | null;
}

/**
 * Unified verification context so any screen can pick it up.
 * - type=email: verify using /auth/verify-email
 * - type=mfa:   verify by re-calling /auth/login with mfa_code
 */
export interface VerificationContext {
  type: VerificationType | null;
  flow: VerificationFlow | null;
  userId: number | null;
  email: string | null;
}

interface AuthState {
  user: UnifiedUserProfile | null;
  token: string | null;

  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  error: string | null;
  loginError: string | null;

  /** Verification context for email verification or MFA verification */
  verification: VerificationContext;

  /** Used to complete login after verifying email / MFA */
  pendingLogin: PendingLogin | null;

  /** Registration UI state */
  registration: {
    isLoading: boolean;
    error: string | null;
  };

  /** Email verification UI state */
  emailVerification: {
    isLoading: boolean;
    error: string | null;
    verified: boolean;
  };

  /** MFA UI state */
  mfa: {
    isRequired: boolean;
    isVerifying: boolean;
    error: string | null;
  };

  /** Password reset flow state */
  passwordReset: {
    isLoading: boolean;
    error: string | null;
    email: string | null;
    expiresAt: string | null;
    resetDone: boolean;
  };

  resendVerification: {
    isLoading: boolean;
    error: string | null;
    expiresAt: string | null;
  };
}

const initialState: AuthState = {
  user: null,
  token: null,

  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  error: null,
  loginError: null,

  verification: {
    type: null,
    flow: null,
    userId: null,
    email: null,
  },

  pendingLogin: null,

  registration: {
    isLoading: false,
    error: null,
  },

  emailVerification: {
    isLoading: false,
    error: null,
    verified: false,
  },

  mfa: {
    isRequired: false,
    isVerifying: false,
    error: null,
  },

  passwordReset: {
    isLoading: false,
    error: null,
    email: null,
    expiresAt: null,
    resetDone: false,
  },

  resendVerification: {
    isLoading: false,
    error: null,
    expiresAt: null,
  },
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /* ---------------------------------------------------------------------- */
    /*                               INIT / CLEAR                              */
    /* ---------------------------------------------------------------------- */

    initializeAuth: (state) => {
      const token           = localStorage.getItem('authToken');
      const userStr         = localStorage.getItem('authUser');
      const verificationStr = localStorage.getItem('authVerification');

      if (token) {
        state.token          = token;
        state.isAuthenticated = true;

        if (userStr) {
          try {
            state.user = JSON.parse(userStr) as UnifiedUserProfile;
          } catch {
            // ignore invalid cached user
          }
        }
      }

      // Restore verification context (userId, email, etc.)
      if (verificationStr) {
        try {
          const saved = JSON.parse(verificationStr);
          if (saved && typeof saved === 'object') {
            state.verification = {
              type:   saved.type   || null,
              flow:   saved.flow   || null,
              userId: saved.userId || null,
              email:  saved.email  || null,
            };
          }
        } catch {
          // ignore corrupted storage
        }
      }

      state.isInitialized = true;
    },

    logout: (state) => {
      Object.assign(state, initialState, { isInitialized: true });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authVerification');
    },

    /* ---------------------------------------------------------------------- */
    /*                           VERIFICATION CONTEXT                           */
    /* ---------------------------------------------------------------------- */

    setVerificationContext: (state, action: PayloadAction<VerificationContext>) => {
      state.verification = action.payload;
      localStorage.setItem(
        'authVerification',
        JSON.stringify({
          type:   action.payload.type,
          flow:   action.payload.flow,
          userId: action.payload.userId,
          email:  action.payload.email,
        }),
      );
    },

    clearVerificationContext: (state) => {
      state.verification = { type: null, flow: null, userId: null, email: null };
      localStorage.removeItem('authVerification');
    },

    setPendingLogin: (state, action: PayloadAction<PendingLogin>) => {
      state.pendingLogin = action.payload;
    },

    clearPendingLogin: (state) => {
      state.pendingLogin = null;
    },

    /* ---------------------------------------------------------------------- */
    /*                                 REGISTER                                */
    /* ---------------------------------------------------------------------- */

    registerStart: (state) => {
      state.registration.isLoading = true;
      state.registration.error     = null;
    },

    registerFailure: (state, action: PayloadAction<string>) => {
      state.registration.isLoading = false;
      state.registration.error     = action.payload;
    },

    /**
     * registerSuccess stores email and userId in the verification context.
     * The user object may be partial (no token until verified).
     */
    registerSuccess: (
      state,
      action: PayloadAction<{
        user: UnifiedUserProfile | null;
        email: string;
        userId: number | null;
      }>,
    ) => {
      state.registration.isLoading = false;
      state.registration.error     = null;

      if (action.payload.user) state.user = action.payload.user;

      const verification = {
        type:   'email' as const,
        flow:   'registration' as const,
        userId: action.payload.userId,
        email:  action.payload.email,
      };
      state.verification = verification;
      localStorage.setItem('authVerification', JSON.stringify(verification));

      state.isAuthenticated = false;
      state.token           = null;
    },

    /* ---------------------------------------------------------------------- */
    /*                                   LOGIN                                 */
    /* ---------------------------------------------------------------------- */

    loginStart: (state) => {
      state.isLoading   = true;
      state.loginError  = null;
      state.error       = null;

      state.mfa.isRequired  = false;
      state.mfa.isVerifying = false;
      state.mfa.error       = null;
    },

    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading       = false;
      state.loginError      = action.payload;
      state.isAuthenticated = false;
    },

    /**
     * loginSuccess stores the token and user, and persists them to localStorage.
     * Called after successful login (including after MFA / email verification + re-login).
     */
    loginSuccess: (
      state,
      action: PayloadAction<{ user: UnifiedUserProfile; token: string }>,
    ) => {
      state.isLoading       = false;
      state.user            = action.payload.user;
      state.token           = action.payload.token;
      state.isAuthenticated = true;
      state.isInitialized   = true;

      state.verification = { type: null, flow: null, userId: null, email: null };
      state.pendingLogin = null;

      localStorage.removeItem('authVerification');
      localStorage.setItem('authToken', action.payload.token);
      localStorage.setItem('authUser', JSON.stringify(action.payload.user));
    },

    /**
     * refreshUser — call this any time the user's profile data changes
     * (e.g. after saving profile settings or uploading a photo).
     * Updates both the Redux state and the persisted localStorage copy.
     */
    refreshUser: (state, action: PayloadAction<UnifiedUserProfile>) => {
      state.user = action.payload;
      localStorage.setItem('authUser', JSON.stringify(action.payload));
    },

    /* ---------------------------------------------------------------------- */
    /*                              EMAIL VERIFICATION                          */
    /* ---------------------------------------------------------------------- */

    verifyEmailStart: (state) => {
      state.emailVerification.isLoading = true;
      state.emailVerification.error     = null;
      state.emailVerification.verified  = false;
    },

    verifyEmailFailure: (state, action: PayloadAction<string>) => {
      state.emailVerification.isLoading = false;
      state.emailVerification.error     = action.payload;
      state.emailVerification.verified  = false;
    },

    verifyEmailSuccess: (state) => {
      state.emailVerification.isLoading = false;
      state.emailVerification.error     = null;
      state.emailVerification.verified  = true;
      // Token is NOT stored here; it will be stored after the subsequent login.
    },

    /* ---------------------------------------------------------------------- */
    /*                                    MFA                                  */
    /* ---------------------------------------------------------------------- */

    /**
     * mfaRequired — sets verification context to type=mfa when login responds with MFA_REQUIRED.
     */
    mfaRequired: (
      state,
      action: PayloadAction<{ email: string; userId: number | null }>,
    ) => {
      state.isLoading = false;

      state.mfa.isRequired  = true;
      state.mfa.isVerifying = false;
      state.mfa.error       = null;

      const verification = {
        type:   'mfa'   as const,
        flow:   'login' as const,
        userId: action.payload.userId,
        email:  action.payload.email,
      };
      state.verification = verification;
      localStorage.setItem('authVerification', JSON.stringify(verification));
    },

    mfaVerificationStart: (state) => {
      state.mfa.isVerifying = true;
      state.mfa.error       = null;
    },

    mfaVerificationFailure: (state, action: PayloadAction<string>) => {
      state.mfa.isVerifying = false;
      state.mfa.error       = action.payload;
    },

    mfaClear: (state) => {
      state.mfa.isRequired  = false;
      state.mfa.isVerifying = false;
      state.mfa.error       = null;
    },

    /* ---------------------------------------------------------------------- */
    /*                           RESEND VERIFICATION                             */
    /* ---------------------------------------------------------------------- */

    resendVerificationStart: (state) => {
      state.resendVerification.isLoading  = true;
      state.resendVerification.error      = null;
      state.resendVerification.expiresAt  = null;
    },

    resendVerificationSuccess: (
      state,
      action: PayloadAction<{ expiresAt: string | null }>,
    ) => {
      state.resendVerification.isLoading = false;
      state.resendVerification.error     = null;
      state.resendVerification.expiresAt = action.payload.expiresAt;
    },

    resendVerificationFailure: (state, action: PayloadAction<string>) => {
      state.resendVerification.isLoading = false;
      state.resendVerification.error     = action.payload;
    },

    /* ---------------------------------------------------------------------- */
    /*                            PASSWORD RESET FLOW                            */
    /* ---------------------------------------------------------------------- */

    forgotPasswordStart: (state) => {
      state.passwordReset.isLoading  = true;
      state.passwordReset.error      = null;
      state.passwordReset.resetDone  = false;
    },

    forgotPasswordSuccess: (
      state,
      action: PayloadAction<{ email: string; expiresAt: string | null }>,
    ) => {
      state.passwordReset.isLoading  = false;
      state.passwordReset.error      = null;
      state.passwordReset.email      = action.payload.email;
      state.passwordReset.expiresAt  = action.payload.expiresAt;
    },

    forgotPasswordFailure: (state, action: PayloadAction<string>) => {
      state.passwordReset.isLoading = false;
      state.passwordReset.error     = action.payload;
    },

    resetPasswordStart: (state) => {
      state.passwordReset.isLoading = true;
      state.passwordReset.error     = null;
      state.passwordReset.resetDone = false;
    },

    resetPasswordSuccess: (state) => {
      state.passwordReset.isLoading = false;
      state.passwordReset.error     = null;
      state.passwordReset.resetDone = true;
    },

    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.passwordReset.isLoading = false;
      state.passwordReset.error     = action.payload;
      state.passwordReset.resetDone = false;
    },

    /* ---------------------------------------------------------------------- */
    /*                                  MISC                                   */
    /* ---------------------------------------------------------------------- */

    clearError: (state) => {
      state.error                      = null;
      state.loginError                 = null;
      state.emailVerification.error    = null;
      state.mfa.error                  = null;
      state.registration.error         = null;
      state.passwordReset.error        = null;
      state.resendVerification.error   = null;
    },
  },
});

export const {
  initializeAuth,
  logout,

  setVerificationContext,
  clearVerificationContext,
  setPendingLogin,
  clearPendingLogin,

  registerStart,
  registerSuccess,
  registerFailure,

  loginStart,
  loginSuccess,
  loginFailure,
  refreshUser,

  verifyEmailStart,
  verifyEmailSuccess,
  verifyEmailFailure,

  mfaRequired,
  mfaVerificationStart,
  mfaVerificationFailure,
  mfaClear,

  resendVerificationStart,
  resendVerificationSuccess,
  resendVerificationFailure,

  forgotPasswordStart,
  forgotPasswordSuccess,
  forgotPasswordFailure,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,

  clearError,
} = authSlice.actions;

/* -------------------------------------------------------------------------- */
/*                                  SELECTORS                                 */
/* -------------------------------------------------------------------------- */

export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectUser  = (state: { auth: AuthState }) => state.auth.user;

/**
 * Returns the best available display name for the authenticated user.
 * Priority: display_name → full_name → name → null
 */
export const selectUserDisplayName = (state: { auth: AuthState }): string | null => {
  const u = state.auth.user;
  if (!u) return null;
  return u.profile?.display_name || u.profile?.full_name || u.name || null;
};

export const selectVerificationContext = (state: { auth: AuthState }) => state.auth.verification;
export const selectPendingLogin        = (state: { auth: AuthState }) => state.auth.pendingLogin;
export const selectPasswordResetEmail  = (state: { auth: AuthState }) => state.auth.passwordReset.email;

export default authSlice.reducer;
