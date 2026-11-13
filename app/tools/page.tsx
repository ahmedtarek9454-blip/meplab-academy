import { redirect } from 'next/navigation';

/** the old members-only tools page: AT Tools now has its own public page */
export default function Tools() {
  redirect('/at-tools');
}
