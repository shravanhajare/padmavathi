import type { ErrorKey } from '@/lib/validation/forms';

/** What a form's server action returns. Error values are translation keys, resolved on the client. */
export type ActionError =
  | ErrorKey
  | 'invalid'
  | 'phoneTaken'
  | 'emailTaken'
  | 'wrongPassword'
  | 'loginFirst'
  | 'unavailable'
  | 'min'
  | 'empty'
  | 'idTaken'
  | 'forbidden';

export type ActionState<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error?: ActionError; fields?: Record<string, ErrorKey>; detail?: { productId?: string; min?: number } }
  | null;
