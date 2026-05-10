import { supabase } from "../lib/supabase"

export const awardPoints = async (userId: string, eventType: string, points: number) => {
  try {
    // 1. Log the event
    await supabase.from('user_events').insert({
      user_id: userId,
      event_type: eventType,
      points_awarded: points
    })

    // 2. Update profile points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', userId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ points: profile.points + points })
        .eq('id', userId)
    }

    return true
  } catch (error) {
    console.error('Gamification Error:', error)
    return false
  }
}

export const checkMilestones = async (_userId: string) => {
  // Logic to check if user reached a milestone and award badge
}
