import { useMutation } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth/auth-client";

interface AuthViewProps {
  onSuccess: () => void;
}

export function AuthView({ onSuccess }: AuthViewProps) {
  const [isSignUp, setIsSignUp] = React.useState(false);

  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to login");
    },
  });

  const { mutate: signUpMutate, isPending: isSignUpPending } = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
      });
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to sign up");
    },
  });

  const isPending = isLoginPending || isSignUpPending;

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    loginMutate({ email, password });
  };

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isPending) return;
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    signUpMutate({ email, password, name });
  };

  return (
    <div className="flex flex-1 flex-col gap-8 px-6 pt-6 pb-6">
      <div className="flex flex-col space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isSignUp
            ? "Enter your email below to create your account"
            : "Enter your email below to sign in"}
        </p>
      </div>

      <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="flex flex-col gap-4">
        <div className="grid gap-2">
          {isSignUp && (
            <div className="grid gap-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="John Doe"
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isPending}
                required
              />
            </div>
          )}
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isPending}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              placeholder="Password"
              type="password"
              autoCapitalize="none"
              autoCorrect="off"
              disabled={isPending}
              required
            />
          </div>
          <Button disabled={isPending} className="mt-2">
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </div>
      </form>

      <div className="text-muted-foreground text-center text-sm">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <button
              onClick={() => setIsSignUp(false)}
              className="hover:text-primary underline underline-offset-4"
            >
              Sign In
            </button>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => setIsSignUp(true)}
              className="hover:text-primary underline underline-offset-4"
            >
              Sign Up
            </button>
          </>
        )}
      </div>
    </div>
  );
}

