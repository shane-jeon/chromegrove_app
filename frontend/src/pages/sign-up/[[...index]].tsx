import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="mt-10 flex justify-center">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" />
    </div>
  );
}
