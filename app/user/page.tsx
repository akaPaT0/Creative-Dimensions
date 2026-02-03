import { UserProfile } from "@clerk/nextjs";

export default function UserPage() {
  return (
    <div className="min-h-screen pt-28 px-6">
      <div className="mx-auto max-w-5xl">
        <UserProfile />
      </div>
    </div>
  );
}
    