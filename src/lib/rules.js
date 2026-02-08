/**
 * Room Rules Service
 * Manage room rules (admin only)
 */

import { supabase } from './supabase'

export const rulesService = {
  /**
   * Get rules for a room
   */
  async getRoomRules(roomId) {
    const { data, error } = await supabase
      .from('room_rules')
      .select('*')
      .eq('room_id', roomId)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data
  },

  /**
   * Add a new rule
   */
  async addRule(roomId, text, sortOrder = 0) {
    const { data, error } = await supabase
      .from('room_rules')
      .insert({
        room_id: roomId,
        text,
        enabled: true,
        sort_order: sortOrder
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Update a rule
   */
  async updateRule(ruleId, updates) {
    const { data, error } = await supabase
      .from('room_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Toggle rule enabled/disabled
   */
  async toggleRule(ruleId) {
    // First get current state
    const { data: current, error: fetchError } = await supabase
      .from('room_rules')
      .select('enabled')
      .eq('id', ruleId)
      .single()
    
    if (fetchError) throw fetchError
    
    // Toggle
    const { data, error } = await supabase
      .from('room_rules')
      .update({ enabled: !current.enabled })
      .eq('id', ruleId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  /**
   * Delete a rule
   */
  async deleteRule(ruleId) {
    const { error } = await supabase
      .from('room_rules')
      .delete()
      .eq('id', ruleId)
    
    if (error) throw error
  },

  /**
   * Bulk update rules (reorder, enable/disable multiple)
   */
  async bulkUpdateRules(rules) {
    const { data, error } = await supabase
      .from('room_rules')
      .upsert(
        rules.map((rule, index) => ({
          id: rule.id,
          room_id: rule.room_id,
          text: rule.text,
          enabled: rule.enabled,
          sort_order: index
        }))
      )
      .select()
    
    if (error) throw error
    return data
  }
}

export default rulesService
