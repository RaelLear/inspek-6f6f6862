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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autenticado')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseUser.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const { action, teamName, memberEmail, memberUsername, teamId } = await req.json()

    if (action === 'add_member') {
      let targetUserId: string | null = null

      // First try to find by username in profiles
      if (memberUsername) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .eq('username', memberUsername.trim().toLowerCase())
          .maybeSingle()
        
        if (profile) {
          targetUserId = profile.id
        }
      }

      // If not found by username, try by email
      if (!targetUserId && memberEmail) {
        // First try profiles table for email-based username
        const { data: profileByEmail } = await supabaseAdmin
          .from('profiles')
          .select('id, username')
          .eq('username', memberEmail.trim().toLowerCase().replace(/\s/g, ''))
          .maybeSingle()
        
        if (profileByEmail) {
          targetUserId = profileByEmail.id
        }

        // Then try auth users list
        if (!targetUserId) {
          const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
          const target = users?.find(u => u.email?.toLowerCase() === memberEmail.trim().toLowerCase())
          if (target) {
            targetUserId = target.id
          }
        }
      }

      if (!targetUserId) {
        return new Response(JSON.stringify({ 
          error: 'Usuário não encontrado. O usuário precisa ter uma conta cadastrada no inSpek.' 
        }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check ownership
      const { data: team } = await supabaseAdmin.from('teams').select('*').eq('id', teamId).single()
      if (!team || team.owner_id !== user.id) {
        return new Response(JSON.stringify({ error: 'Sem permissão' }), { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      // Check if trying to add self
      if (targetUserId === user.id) {
        return new Response(JSON.stringify({ error: 'Você já é o dono da equipe' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

      const { error } = await supabaseAdmin.from('team_members').insert({
        team_id: teamId,
        user_id: targetUserId,
      })
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          return new Response(JSON.stringify({ error: 'Usuário já é membro da equipe' }), { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          })
        }
        throw error
      }

      // Get the member's profile info
      const { data: memberProfile } = await supabaseAdmin
        .from('profiles')
        .select('username, display_name')
        .eq('id', targetUserId)
        .maybeSingle()

      return new Response(JSON.stringify({ 
        success: true, 
        member: { 
          id: targetUserId, 
          username: memberProfile?.username,
          display_name: memberProfile?.display_name
        } 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'get_own_profile') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', user.id)
        .maybeSingle()

      return new Response(JSON.stringify({ profile }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})