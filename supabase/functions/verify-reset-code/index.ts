import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code) {
      return new Response(JSON.stringify({ error: 'Email and code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (newPassword && newPassword.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
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
    const cleanCode = code.trim();

    const dbResponse = await fetch(`${supabaseUrl}/rest/v1/password_reset_codes?select=*&email=eq.${encodeURIComponent(normalizedEmail)}&code=eq.${encodeURIComponent(cleanCode)}&used=eq.false&order=created_at.desc&limit=1`, {
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!dbResponse.ok) {
      throw new Error('Failed to check reset code');
    }

    const codes = await dbResponse.json();
    if (!codes || codes.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resetRecord = codes[0];
    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);

    if (now > expiresAt) {
      return new Response(JSON.stringify({ error: 'Code expired. Please request a new one.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!newPassword) {
      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/password_reset_codes?id=eq.${resetRecord.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ used: true }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to mark code as used:', await updateResponse.text());
    }

    const adminResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=eq.${encodeURIComponent(normalizedEmail)}`, {
      method: 'GET',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!adminResponse.ok) {
      const errText = await adminResponse.text();
      console.error('Admin list users error:', errText);
      throw new Error('Failed to find user');
    }

    const adminData = await adminResponse.json();
    const users = Array.isArray(adminData) ? adminData : (adminData?.users ?? []);
    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = users[0].id;

    const passwordUpdateResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({ password: newPassword }),
    });

    if (!passwordUpdateResponse.ok) {
      const errText = await passwordUpdateResponse.text();
      console.error('Password update error:', errText);
      return new Response(JSON.stringify({ error: 'Failed to update password' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signOutResponse = await fetch(`${supabaseUrl}/auth/v1/logout?scope=global`, {
      method: 'POST',
      headers: {
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
    });

    if (!signOutResponse.ok) {
      console.error('Sign out error:', await signOutResponse.text());
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('verify-reset-code error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
