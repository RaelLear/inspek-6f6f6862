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
    const { action, adminCode, adminPassword, targetUserId } = await req.json()

    if (adminCode !== '648808' || adminPassword !== 'seguranca') {
      return new Response(JSON.stringify({ error: 'Acesso negado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    if (action === 'list_users') {
      const { data: profiles } = await supabaseAdmin.from('profiles').select('*')
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      const { data: subs } = await supabaseAdmin.from('subscriptions').select('*')
      
      const result = (users || []).map(u => {
        const profile = profiles?.find(p => p.id === u.id)
        const sub = subs?.find(s => s.user_id === u.id)
        return {
          id: u.id,
          email: u.email,
          display_name: profile?.display_name || u.user_metadata?.full_name || '-',
          created_at: u.created_at,
          subscription: sub || null,
        }
      })
      
      return new Response(JSON.stringify({ users: result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'grant_permanent') {
      const { error } = await supabaseAdmin.from('subscriptions').upsert({
        user_id: targetUserId,
        status: 'active',
        permanent: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'revoke_permanent') {
      const { error } = await supabaseAdmin.from('subscriptions').update({
        permanent: false,
        status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('user_id', targetUserId)
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})