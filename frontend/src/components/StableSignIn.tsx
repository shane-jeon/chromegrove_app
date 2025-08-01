import React, { memo } from "react";
import { SignIn } from "@clerk/nextjs";

interface StableSignInProps {
  path: string;
  routing: "path";
  signUpUrl: string;
  afterSignInUrl: string;
}

const StableSignIn = memo<StableSignInProps>(
  ({ path, routing, signUpUrl, afterSignInUrl }) => {
    return (
      <SignIn
        path={path}
        routing={routing}
        signUpUrl={signUpUrl}
        afterSignInUrl={afterSignInUrl}
      />
    );
  },
);

StableSignIn.displayName = "StableSignIn";

export default StableSignIn;
