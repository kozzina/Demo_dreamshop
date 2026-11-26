import { json } from "@/server/http";
import { managerStats } from "@/server/shop/manager";

/** Today's orders and turnover for the manager chat header. */
export async function GET() {
  return json(await managerStats());
}
