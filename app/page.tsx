import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      {/* User button in top right */}
      <div className="absolute top-4 right-4">
        <UserButton afterSignOutUrl="/sign-in"/>
      </div>

      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Protected Home Page</h1>
        <p>Welcome! Your user ID is: {userId}</p>
      </main>
    </div>
  );
}