import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { event, email, user_id } = body

    if (event !== 'pix_paid') {
      return new Response(JSON.stringify({ error: 'Evento não suportado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let targetUserId = user_id

    if (!targetUserId && email) {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const user = users?.find(u => u.email === email)
      if (user) targetUserId = user.id
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Grant 30 days of access from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: targetUserId,
      status: 'active',
      trial_ends_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return new Response(JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
