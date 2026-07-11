export function PageHeader({
  line1,
  line2,
  breadcrumb,
  action,
}: {
  line1: string;
  line2?: string;
  breadcrumb: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="px-4 pt-8 sm:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="mono-label flex items-center gap-1 text-muted-2">
          <span>{breadcrumb}</span>
          <span className="animate-blink inline-block h-3 w-[7px] bg-accent" aria-hidden />
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display font-bold uppercase leading-[0.96] tracking-[-0.04em] text-[clamp(2.5rem,8vw,4.5rem)]">
            {line1}
            {line2 && (
              <>
                <br />
                <span className="text-stroke-ink">{line2}</span>
              </>
            )}
          </h1>
          {action}
        </div>
      </div>
    </header>
  );
}
