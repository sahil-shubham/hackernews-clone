import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <LoginForm />
      <div className="text-center mt-4">
        Don&apos;t have an account? <Link href="/signup" className="text-orange-600 hover:underline">Sign up</Link>
      </div>
    </div>
  );
} 