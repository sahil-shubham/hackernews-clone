import SignupForm from '@/components/auth/SignupForm';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <SignupForm />
      <div className="text-center mt-4">
        Already have an account? <Link href="/login" className="text-orange-600 hover:underline">Login</Link>
      </div>
    </div>
  );
} 