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

    if (event === 'payment_confirmed' || event === 'subscription_activated') {
      // Always set expiry to exactly 31 days from NOW (not accumulating)
      const newExpiry = new Date()
      newExpiry.setDate(newExpiry.getDate() + 31)

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: targetUserId,
        status: 'active',
        trial_ends_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } else if (event === 'subscription_cancelled' || event === 'payment_failed') {
      await supabaseAdmin.from('subscriptions').update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      }).eq('user_id', targetUserId)
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
