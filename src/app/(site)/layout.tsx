import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { EditTokenBridge } from "@/components/edit-token-bridge";
import { api } from "@/lib/api";

/**
 * Shared chrome for the main site. Standalone tool pages (e.g. /soc-prep)
 * live outside this group and render without the Nav/Footer.
 */
export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [site, settings] = await Promise.all([api.site(), api.settings()]);

  return (
    <>
      <EditTokenBridge />
      <Nav wordmark={site.wordmark} logo={settings.logo ?? site.logo ?? null} />
      <main>{children}</main>
      <Footer site={site} />
    </>
  );
}
