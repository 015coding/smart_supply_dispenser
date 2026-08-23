"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(async () => {
  // Turbopack can tree-shake ApiDOM's registration side effect when it is only
  // reached through swagger-client. Load the namespace before Swagger UI.
  await import("@swagger-api/apidom-ns-openapi-3-1");
  return (await import("swagger-ui-react")).default;
}, { ssr: false });

export function SwaggerViewer() {
  return <SwaggerUI url="/api/openapi.json" />;
}
