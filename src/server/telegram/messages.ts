import type { OrderStatus } from "@/domain/order";

/** Everything the shop bot says on its own (the assistant's replies come from the model). */

export const GREETING =
  "Здравствуйте! Я Соня из Dream Shop. Можно открыть магазин кнопкой ниже или просто рассказать, какой сон хочется, — подберу.\n\nДемо: товары вымышленные, деньги не списываются.";

export const OPEN_SHOP_BUTTON = "Открыть магазин";

/** Under a reply that changed the cart: one tap to see it. */
export const OPEN_CART_BUTTON = "Открыть корзину";

export interface OrderNotice {
  number: number;
  status: OrderStatus;
  total: string;
  items: { name: string; night: string }[];
}

const DAY = new Intl.DateTimeFormat("ru", { day: "numeric", month: "long", timeZone: "UTC" });
const nightLabel = (night: string) => DAY.format(new Date(`${night}T00:00:00Z`));

/** The message the buyer gets when their order is placed or moves on; null when there is nothing to say. */
export function orderNotice(order: OrderNotice): string | null {
  const firstNight = order.items.map((item) => item.night).sort()[0];
  switch (order.status) {
    case "new": {
      const lines = order.items.map((item) => `«${item.name}», ночь на ${nightLabel(item.night)}`).join("; ");
      return `Заказ №${order.number} оформлен: ${lines}. Итого ${order.total}.`;
    }
    case "accepted":
      return `Заказ №${order.number} взяли в работу. Обычно подготовка занимает пару минут, по готовности напишу.`;
    case "assembling":
      return `Заказ №${order.number}: мастерская настраивает сюжет под вашу ночь.`;
    case "delivering":
      return `Заказ №${order.number}: сон готов и ждёт ночи ${firstNight ? nightLabel(firstNight) : ""}. Просто ложитесь спать.`;
    case "delivered":
      return `Заказ №${order.number} доставлен. Хороших снов!`;
    case "cancelled":
      return `Заказ №${order.number} отменён.`;
  }
}
