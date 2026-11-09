'use client';
import { useFormStatus } from 'react-dom';

export default function SubmitButton({ children, className = 'btn-red', name, value }: { children: React.ReactNode; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} name={name} value={value}>
      {pending ? '…' : children}
    </button>
  );
}
