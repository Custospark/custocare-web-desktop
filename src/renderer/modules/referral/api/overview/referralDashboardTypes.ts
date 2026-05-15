/**
 * Types for GET /referrals/facility/{facilityId}/dashboard
 */

export interface SummaryStatBlock {
  value: number;
  change_pct?: number | null;
  change_label?: string | null;
}

export interface ReferralDashboardSummary {
  queue_visits: SummaryStatBlock;
  pending_incoming: SummaryStatBlock;
  pending_outgoing: SummaryStatBlock;
  accepted_active: SummaryStatBlock;
  completed_today: SummaryStatBlock;
}

export interface ReferralActivityDay {
  day: string;
  date: string;
  created: number;
  completed: number;
  rejected: number;
}

export interface ReferralActivityBlock {
  bucket: string;
  series: ReferralActivityDay[];
  totals: {
    created_week: number;
    completed_week: number;
    rejected_week: number;
    avg_created_per_day: number;
  };
}

export interface ReferralStatusPoint {
  status: string;
  label: string;
  count: number;
}

export interface ReferralStatusBreakdown {
  series: ReferralStatusPoint[];
}

export interface ReferralRecentItem {
  id: string;
  referral_uuid: string;
  status: string;
  priority: string;
  referral_type: string;
  patient_name: string;
  referring_facility_name: string | null;
  receiving_facility_name: string | null;
  referral_date: string | null;
  updated_at: string | null;
}

export interface ReferralDashboardData {
  summary: ReferralDashboardSummary;
  referral_activity: ReferralActivityBlock;
  status_breakdown: ReferralStatusBreakdown;
  recent_referrals: ReferralRecentItem[];
}

export interface ReferralDashboardResponse {
  success: boolean;
  message: string;
  data: ReferralDashboardData;
}
