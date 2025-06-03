import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { publicEnv } from "app/env.server";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import polaris_override_styles from "app/styles/polaris_override.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: polaris_override_styles },
];
export const loader = () => {
  return { publicEnv };
};

export default function App() {
  const { publicEnv } = useLoaderData<typeof loader>();
  return (
    <html lang="en" data-app-url={publicEnv.PUBLIC_APP_URL}>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
