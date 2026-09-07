"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { t, type Locale } from "@/domain/messages";
import type { AdminMatchRow, AdminReportRow, AdminSpotAddRow, AdminSpotRow } from "@/domain/viewModels";
import { Button } from "@/components/ui/button";

export function AdminQueue({
  locale,
  reports,
  spots,
  matches,
  spotAdds,
}: {
  locale: Locale;
  reports: AdminReportRow[];
  spots: AdminSpotRow[];
  matches: AdminMatchRow[];
  spotAdds: AdminSpotAddRow[];
}) {
  const router = useRouter();
  const restore = useMutation(api.admin.restore);
  const keepHidden = useMutation(api.admin.keepHidden);
  const closeSpot = useMutation(api.admin.closeSpot);
  const reopenSpot = useMutation(api.admin.reopenSpot);
  const approveMatch = useMutation(api.admin.approveMatch);
  const rejectMatch = useMutation(api.admin.rejectMatch);
  const approveSpotAdd = useMutation(api.admin.approveSpotAdd);
  const rejectSpotAdd = useMutation(api.admin.rejectSpotAdd);
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
          {t(locale, "captionQueue")}
        </h2>
        {matches.length === 0 ? (
          <p className="mt-6 text-berry/70">{t(locale, "noCaptionQueue")}</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {matches.map((match) => (
              <li
                key={match.queueId}
                className="rounded-slab border border-berry/10 bg-white px-5 py-4"
              >
                <p className="text-xl font-bold">{match.caption}</p>
                {match.proposedSpotName && match.proposedSpotPath ? (
                  <Link
                    href={match.proposedSpotPath}
                    className="mt-1 block text-sm font-bold text-blush"
                  >
                    {match.proposedSpotName}
                  </Link>
                ) : null}
                <a
                  href={match.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 block text-sm text-berry/70"
                >
                  {match.permalink}
                </a>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => approveMatch({ queueId: match.queueId }))
                    }
                  >
                    {t(locale, "approveMatch")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => rejectMatch({ queueId: match.queueId }))
                    }
                  >
                    {t(locale, "rejectMatch")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl tracking-wide">
          {t(locale, "spotAddQueue")}
        </h2>
        {spotAdds.length === 0 ? (
          <p className="mt-6 text-berry/70">{t(locale, "noSpotAdds")}</p>
        ) : (
          <ul className="mt-6 grid gap-3">
            {spotAdds.map((row) => (
              <li
                key={row.queueId}
                className="rounded-slab border border-berry/10 bg-white px-5 py-4"
              >
                <p className="text-xl font-bold">{row.name}</p>
                <p className="mt-1 text-sm text-berry/70">
                  {row.citySlug} · {row.types.join(", ")}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={pending}
                    onClick={() =>
                      run(() => approveSpotAdd({ queueId: row.queueId }))
                    }
                  >
                    {t(locale, "approveSpotAdd")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(() => rejectSpotAdd({ queueId: row.queueId }))
                    }
                  >
                    {t(locale, "rejectSpotAdd")}
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
