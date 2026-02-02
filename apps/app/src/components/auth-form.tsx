import { useMutation } from "@tanstack/react-query";
import { AlertCircle, LoaderCircle } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/lib/auth/auth-client-convex";
import { Alert, AlertDescription } from "./ui/alert";

interface AuthFormProps {
  orgName: string;
  orgId: string;
  onSuccess: () => void;
  mode?: "page" | "dialog";
}

export function AuthForm({ orgName, orgId, onSuccess, mode = "page" }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [formError, setFormError] = React.useState("");

  const { mutate: loginMutate, isPending: isLoginPending } = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        // @ts-expect-error - dynamic property
        organizationId: orgId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Logged in successfully");
      onSuccess();
    },
    onError: (error) => {
      setFormError(error.message ?? "Failed to login");
    },
  });

  const { mutate: signUpMutate, isPending: isSignUpPending } = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const response = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        // @ts-expect-error - dynamic property
        organizationId: orgId,
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      onSuccess();
    },
    onError: (error: any) => {
      setFormError(error.message ?? "Failed to sign up");
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
    <div
      className={
        mode === "page"
          ? "mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]"
          : "grid gap-6"
      }
    >
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignUp ? "Create an account" : "Welcome back"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isSignUp
            ? "Enter your email below to create your account"
            : "Enter your email below to sign in"}{" "}
          to {orgName}
        </p>
      </div>

      <div className="grid gap-6">
        {formError && (
          <Alert variant="destructive">
            <AlertDescription className="flex items-center gap-2">
              <AlertCircle className="size-4" /> {formError}
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={isSignUp ? handleSignUp : handleLogin}>
          <div className="grid gap-5">
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
            <Button type="submit" disabled={isPending}>
              {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </div>
        </form>
      </div>

      <div className="text-muted-foreground px-8 text-center text-sm">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <button
              onClick={() => {
                setIsSignUp(false);
                setFormError("");
              }}
              className="hover:text-primary underline underline-offset-4"
            >
              Sign In
            </button>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <button
              onClick={() => {
                setIsSignUp(true);
                setFormError("");
              }}
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
