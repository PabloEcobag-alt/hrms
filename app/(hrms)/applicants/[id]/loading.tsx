import { PAGE } from "@/components/hiring/parts";
import { ProfileSkeleton } from "./profile-skeleton";

export default function Loading() {
  return (
    <div className={PAGE}>
      <ProfileSkeleton />
    </div>
  );
}
