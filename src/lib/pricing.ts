import { ApiError, del, get, patch, post } from './api';
import { endpoints } from './endpoints';
import type {
  Paginated,
  PricingBreakdown,
  PricingPreviewInput,
  PricingRuleCreateInput,
  PricingRuleRecord,
  PricingRuleUpdateInput,
} from '@/types';

export const PRICING_RULE_KIND_LABELS: Record<PricingRuleRecord['ruleType'], string> = {
  hourly: 'Hourly',
  fixed: 'Fixed package',
  daily: 'Daily maximum',
};

export async function fetchPricingRules(
  facilityId: string,
  page = 1,
  limit = 100,
): Promise<Paginated<PricingRuleRecord>> {
  return get<Paginated<PricingRuleRecord>>(endpoints.pricing.rules, {
    params: { facilityId, page, limit },
  });
}

export async function createPricingRule(
  input: PricingRuleCreateInput,
): Promise<PricingRuleRecord> {
  return post<PricingRuleRecord>(endpoints.pricing.createRule, input);
}

export async function updatePricingRule(
  id: string,
  input: PricingRuleUpdateInput,
): Promise<PricingRuleRecord> {
  return patch<PricingRuleRecord>(endpoints.pricing.updateRule(id), input);
}

export async function deletePricingRule(id: string): Promise<void> {
  await del<void>(endpoints.pricing.deleteRule(id));
}

export async function previewPrice(input: PricingPreviewInput): Promise<PricingBreakdown> {
  return post<PricingBreakdown>(endpoints.pricing.preview, input);
}

export function pricingErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'PRICING_RULE_NAME_TAKEN':
        return 'A rule with this name already exists for the facility.';
      case 'PRICING_RULE_LIMIT_REACHED':
        return err.message;
      case 'PRICING_NOT_AVAILABLE':
        return 'This facility has no published rate yet.';
      case 'PRICING_RULE_NOT_FOUND':
        return 'That pricing rule no longer exists.';
      case 'SESSION_EXTENSION_CONFLICT':
        return 'The space is already booked for that extension. Choose a shorter extension.';
      case 'SESSION_EXTENSION_TOO_LONG':
        return 'That extension is too long for this booking.';
      case 'SESSION_NOT_ACTIVE':
        return 'This parking session is no longer active.';
      case 'RATE_LIMITED':
        return 'Too many attempts for now. Wait a little and try again.';
      default:
        break;
    }
    if (err.status === 401) return 'Your session has expired. Sign in again.';
    if (err.status === 403) return 'You do not have access to this facility.';
    if (err.status === 404) return 'That facility or pricing rule does not exist.';
    if (err.status === 409) return err.message;
    if (err.status === 422) return 'That pricing request is not valid.';
    if (err.status === 429) return 'Too many attempts for now. Wait a little and try again.';
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}
