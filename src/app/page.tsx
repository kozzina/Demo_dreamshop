import { redirect } from "next/navigation";

/**
 * The app's own address opens the shop. The case page with both phones lives on the
 * portfolio site and embeds /app and /manager.
 */
export default function Home() {
  redirect("/app");
}
