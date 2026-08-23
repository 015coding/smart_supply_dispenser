const ADMIN_ROOT = "/admin";
const ADMIN_LOGIN = "/admin/login";

export function getSafeAdminRedirectPath(value: string | null, origin: string): string {
  if (!value) return ADMIN_ROOT;

  try {
    const url = new URL(value, origin);
    const isAdminPath = url.pathname === ADMIN_ROOT || url.pathname.startsWith(`${ADMIN_ROOT}/`);
    const isLoginPath = url.pathname === ADMIN_LOGIN || url.pathname.startsWith(`${ADMIN_LOGIN}/`);

    if (url.origin !== origin || !isAdminPath || isLoginPath) return ADMIN_ROOT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return ADMIN_ROOT;
  }
}
