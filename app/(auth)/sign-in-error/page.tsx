import { LOGIN_PATH } from "@/lib/portal/config";

const MESSAGES: Record<string, { title: string; body: string }> = {
  denied: {
    title: "You don't have access to HRMS",
    body: "The Portal did not grant you access. Ask for an HRMS Module to be granted to you at the Portal.",
  },
  unavailable: {
    title: "Sign-in is temporarily unavailable",
    body: "HRMS could not reach the Portal. Please try again in a moment.",
  },
  failed: {
    title: "Sign-in could not be completed",
    body: "The sign-in link may have expired or already been used. Please sign in again.",
  },
};

export default async function SignInErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message = MESSAGES[reason ?? ""] ?? MESSAGES.failed;

  return (
    <main className="min-h-screen flex items-center justify-center p-md">
      <div className="max-w-[28rem] space-y-sm text-center">
        <h1 className="text-headline-md text-foreground">{message.title}</h1>
        <p className="text-body-sm text-muted-foreground">{message.body}</p>
        <a href={LOGIN_PATH} className="text-sm font-medium underline">
          Try signing in again
        </a>
      </div>
    </main>
  );
}
