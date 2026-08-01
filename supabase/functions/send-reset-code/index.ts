import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase not configured');
    }

    const normalizedEmail = email.trim().toLowerCase();

    const dbCheck = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&email=eq.${encodeURIComponent(normalizedEmail)}`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!dbCheck.ok) {
      throw new Error('Failed to check user');
    }

    const profiles = await dbCheck.json();
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No account found with that email.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/password_reset_codes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
        used: false,
      }),
    });

    if (!dbResponse.ok) {
      const errText = await dbResponse.text();
      console.error('DB error:', errText);
      throw new Error('Failed to store reset code');
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('Resend API key not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Umurage Hub <no-reply@umurage.rw>',
        to: [normalizedEmail],
        subject: 'Your Umurage Hub Password Reset Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #DAA34C; font-size: 28px; margin: 0;">UMURAGE</h1>
              <p style="color: #8B7355; margin: 5px 0 0;">Rwanda's Cultural Heritage Platform</p>
            </div>
            <div style="background: #1a1208; border: 1px solid #3D2510; border-radius: 16px; padding: 30px; text-align: center;">
              <h2 style="color: #F5E6D0; margin-top: 0;">Password Reset Code</h2>
              <p style="color: #8B7355; margin-bottom: 20px;">Use the following 4-digit code to reset your password:</p>
              <div style="background: #2b180d; border: 2px solid #DAA34C; border-radius: 12px; padding: 20px; display: inline-block; min-width: 200px;">
                <span style="color: #DAA34C; font-size: 36px; font-weight: bold; letter-spacing: 8px;">${code}</span>
              </div>
              <p style="color: #8B7355; margin-top: 20px; font-size: 14px;">This code expires in 10 minutes.</p>
              <p style="color: #6B5B4F; font-size: 12px; margin-top: 10px;">If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errText = await emailResponse.text();
      console.error('Resend error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-reset-code error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
