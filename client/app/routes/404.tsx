import NotFound from "~/pages/NotFound";


export function loader() {
  return { status: 404 };
}

export default function NotFoundRoute() {
  return <NotFound />;
}
