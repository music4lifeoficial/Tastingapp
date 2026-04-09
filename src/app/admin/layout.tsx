import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get("admin_auth")?.value === "true";

  return (
    <div className="admin-container" style={{ minHeight: "100vh", background: "#f8f9fa", color: "#333" }}>
      <header style={{ background: "var(--dark)", color: "white", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/admin" style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--gold)", textDecoration: "none" }}>
          Lupulus Admin
        </Link>
        {isAuthenticated && (
          <nav style={{ display: "flex", gap: "1.5rem" }}>
            <Link href="/admin" style={{ color: "white", textDecoration: "none" }}>Dashboard</Link>
            <Link href="/" style={{ color: "white", textDecoration: "none", opacity: 0.7 }}>Ver Web Publica</Link>
          </nav>
        )}
      </header>
      <main style={{ padding: "2rem" }}>
        {children}
      </main>
    </div>
  );
}