import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0b0d]">
      <SignIn
        appearance={{
          variables: { colorPrimary: '#6366f1' },
        }}
      />
    </div>
  )
}
