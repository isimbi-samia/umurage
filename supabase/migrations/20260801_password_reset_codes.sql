-- Password reset codes table for code-based password reset flow
CREATE TABLE IF NOT EXISTS public.password_reset_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_codes_email ON public.password_reset_codes (email);
CREATE INDEX IF NOT EXISTS idx_password_reset_codes_code ON public.password_reset_codes (code);
