import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0b0d]">
      <SignUp
        appearance={{
          variables: { colorPrimary: '#6366f1' },
        }}
      />
    </div>
  )
}
