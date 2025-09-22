"use client";

import { Facebook, FacebookIcon } from "lucide-react";
import React, { useTransition } from "react";


const LoginFacebook = () => {
  const [isPending, startTransition] = useTransition();

  const handleFacebookLogin = () => {
    startTransition(async () => {
      // await signInWithFacebook();
    });
  };
  return (
    <div
      onClick={handleFacebookLogin}
      className="w-full gap-4 hover:cursor-pointer mt-6 h-12 bg-gray-800 rounded-md p-4 flex justify-center items-center"
    >
      <FacebookIcon className="text-white" />
      <p className="text-white">
        {isPending ? "Redirecting..." : "Login with Facebook"}
      </p>
    </div>
  );
};

export default LoginFacebook;