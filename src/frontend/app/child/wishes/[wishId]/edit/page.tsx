"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppCard } from "@/components/ui/card";
import { ApiError, getWish } from "@/features/api/client";
import { ChildWishEditForm } from "@/features/incentives/child-wish-edit-form";
import type { Wish } from "@/features/tasks/types";

export default function EditWishPage() {
  const { wishId } = useParams<{ wishId: string }>();
  const [wish, setWish] = useState<Wish | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getWish(wishId);
        if (active) {
          setWish(result.wish);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof ApiError ? err.message : "加载心愿失败");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [wishId]);

  if (isLoading) {
    return <AppCard className="text-body-sm text-muted">正在加载心愿详情...</AppCard>;
  }

  if (!wish) {
    return <AppCard className="text-body-sm text-brand-coral">{error || "心愿不存在"}</AppCard>;
  }

  if (wish.status !== "rejected") {
    return (
      <AppCard className="text-body-sm text-brand-coral">
        只能修改被家长驳回的心愿。
      </AppCard>
    );
  }

  return <ChildWishEditForm wish={wish} />;
}
