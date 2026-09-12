"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { t, type Locale } from "@/domain/messages";
import type { AdminReportRow, AdminSpotRow } from "@/domain/viewModels";
import { Button } from "@/components/ui/button";

export function AdminQueue({
  locale,
  reports,
  spots,
}: {
  locale: Locale;
  reports: AdminReportRow[];
  spots: AdminSpotRow[];
}) {
  const router = useRouter();
  const restore = useMutation(api.admin.restore);
  const keepHidden = useMutation(api.admin.keepHidden);
  const closeSpot = useMutation(api.admin.closeSpot);
  const reopenSpot = useMutation(api.admin.reopenSpot);
  const [pending, setPending] = useState(false);

  async function run(work: () => Promise<unknown>) {
    setPending(true);
    try {
      await work();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="mt-10">
        <h2 className="font-display text-2xl tracking-wide">
          {t(locale, "openReports")}
        </h2>
        {reports.length === 0 ? (
          <p className="mt-6 text-berry/70">{t(locale, "noOpenReports")}</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {reports.map((report) => (
              <li
                key={report.reportId}
                className="rounded-slab border border-berry/10 bg-white px-5 py-4"
              >
                <Link
                  href={report.spotPath}
                  className="text-xl font-bold text-blush"
                >
                  {report.spotName}
                </Link>
                <p className="mt-1 text-sm text-berry/70">{report.reason}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => restore({ reportId: report.reportId }))
                    }
                  >
                    {t(locale, "restoreBrag")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => keepHidden({ reportId: report.reportId }))
                    }
                  >
                    {t(locale, "keepHidden")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide">
          {t(locale, "adminSpots")}
        </h2>
        <ul className="mt-6 grid gap-3">
          {spots.map((spot) => (
            <li
              key={spot.spotId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-slab border border-berry/10 bg-shell px-5 py-4"
            >
              <div>
                <Link
                  href={`/nl/${spot.citySlug}/${spot.slug}`}
                  className="text-xl font-bold"
                >
                  {spot.name}
                </Link>
                <p className="mt-1 text-sm text-berry/55">
                  {spot.listingStatus === "gravestone"
                    ? t(locale, "closed")
                    : spot.citySlug}
                </p>
              </div>
              {spot.listingStatus === "listed" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() =>
                    run(() => closeSpot({ spotId: spot.spotId }))
                  }
                >
                  {t(locale, "closeSpot")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(() => reopenSpot({ spotId: spot.spotId }))
                  }
                >
                  {t(locale, "reopenSpot")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
