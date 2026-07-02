import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/transfer")({
  beforeLoad: () => {
    throw redirect({ to: "/local-transfer" });
  },
  component: () => null,
});
