import { Router } from 'express'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  authLimiter,
  passwordResetLimiter,
  refreshLimiter,
} from '../middleware/rateLimiter.js'
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  VerifyEmailSchema,
  MigrateLocalDataSchema,
} from '@resumark/shared'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  migrateLocalDataHandler,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/register',          authLimiter,           validate(RegisterSchema),         registerHandler)
router.post('/login',             authLimiter,           validate(LoginSchema),            loginHandler)
router.post('/refresh',           refreshLimiter,                                           refreshHandler)
router.post('/logout',            authenticate,                                             logoutHandler)
router.post('/forgot-password',   passwordResetLimiter,  validate(ForgotPasswordSchema),   forgotPasswordHandler)
router.post('/reset-password',    passwordResetLimiter,  validate(ResetPasswordSchema),    resetPasswordHandler)
router.post('/verify-email',                             validate(VerifyEmailSchema),       verifyEmailHandler)
router.post('/migrate-local-data', authenticate,         validate(MigrateLocalDataSchema), migrateLocalDataHandler)

export default router
