import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="container-x py-24 text-center">
      <div className="text-6xl font-bold text-brand-red">404</div>
      <Link href="/" className="btn-blue mt-6">MEP LAB</Link>
    </section>
  );
}
