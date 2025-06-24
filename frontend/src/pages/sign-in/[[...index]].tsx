import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="mt-10 flex justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" />
    </div>
  );
}
