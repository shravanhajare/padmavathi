import 'server-only';
import { sql } from './db';

export interface Address {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

/** A signed-in customer's saved addresses, default first. */
export async function listAddresses(userId: string): Promise<Address[]> {
  return sql<Address>(
    'select id, label, name, phone, line1, landmark, city, state, pincode, is_default from public.addresses where user_id = $1 order by is_default desc, created_at desc',
    [userId],
  );
}
