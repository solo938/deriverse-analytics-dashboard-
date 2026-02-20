import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// ─── Trades ──────────────────────────────────────────────────────────────────

export async function fetchTradesByWallet(walletAddress: string) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('opened_at', { ascending: false });

  if (error) throw new Error(`fetchTradesByWallet: ${error.message}`);
  return data;
}

export async function fetchTradesByDateRange(
  walletAddress: string,
  from: string,
  to: string
) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('wallet_address', walletAddress)
    .gte('opened_at', from)
    .lte('opened_at', to)
    .order('opened_at', { ascending: false });

  if (error) throw new Error(`fetchTradesByDateRange: ${error.message}`);
  return data;
}

export async function fetchTradesByAsset(walletAddress: string, asset: string) {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('asset', asset)
    .order('opened_at', { ascending: false });

  if (error) throw new Error(`fetchTradesByAsset: ${error.message}`);
  return data;
}

// ─── Positions ────────────────────────────────────────────────────────────────

export async function fetchOpenPositions(walletAddress: string) {
  const { data, error } = await supabase
    .from('positions')
    .select('*')
    .eq('wallet_address', walletAddress)
    .eq('status', 'open')
    .order('opened_at', { ascending: false });

  if (error) throw new Error(`fetchOpenPositions: ${error.message}`);
  return data;
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function fetchReferralsByReferrer(referrerAddress: string) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_address', referrerAddress);

  if (error) throw new Error(`fetchReferralsByReferrer: ${error.message}`);
  return data;
}

export async function fetchReferralByCode(referralCode: string) {
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referral_code', referralCode)
    .single();

  if (error) throw new Error(`fetchReferralByCode: ${error.message}`);
  return data;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export function subscribeToPositions(
  walletAddress: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`positions:${walletAddress}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'positions',
        filter: `wallet_address=eq.${walletAddress}`,
      },
      callback
    )
    .subscribe();
}

export function subscribeToTrades(
  walletAddress: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel(`trades:${walletAddress}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trades',
        filter: `wallet_address=eq.${walletAddress}`,
      },
      callback
    )
    .subscribe();
}