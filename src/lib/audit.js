import { supabase } from '@/supabaseClient'

/**
 * Record an admin action. This is intentionally fire-and-forget so a logging
 * failure can never block the operation the admin actually asked for.
 */
export async function logAudit({ action, entityType, entityId = null, details = {} }) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    let actorName = user.email || 'Admin'
    let actorEmail = user.email || null
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle()
    if (profile) {
      actorName = profile.full_name || profile.email || actorName
      actorEmail = profile.email || actorEmail
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_name: actorName,
      actor_email: actorEmail,
      action,
      entity_type: entityType,
      entity_id: entityId == null ? null : String(entityId),
      details,
    })
  } catch (error) {
    console.error('Could not write audit log', error)
  }
}
