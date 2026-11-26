import { Suspense } from "react";
import { dreamBlurbs } from "@/server/knowledge";
import { CatalogHome } from "./CatalogHome";

/** Home and catalogue. Teasers and moods come from the knowledge base at build time; stock is live. */
export default function CatalogPage() {
  return (
    <Suspense>
      <CatalogHome blurbs={dreamBlurbs()} />
    </Suspense>
  );
}
