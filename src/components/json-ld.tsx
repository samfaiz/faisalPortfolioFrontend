/**
 * Renders JSON-LD structured data as `<script type="application/ld+json">`.
 * Server component (SSR) — safe to drop into async server pages. Accepts a
 * single object or an array; renders nothing when there's no data.
 */
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  const items = Array.isArray(data) ? data : [data];
  const blocks = items.filter(
    (item) => item && typeof item === "object" && Object.keys(item).length > 0,
  );

  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
}
