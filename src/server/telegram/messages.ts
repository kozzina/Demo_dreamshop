import type { OrderStatus } from "@/domain/order";

/** Everything the shop bot says on its own (the assistant's replies come from the model). */

export const GREETING =
  "Здравствуйте! Я Вера из Магазина снов. Магазин открывается кнопкой ниже: там каталог, корзина и ваши заказы.\n\nДемо: товары вымышленные, деньги не списываются.";

export const OPEN_SHOP_BUTTON = "Открыть магазин";

/** Until the assistant is connected, free text gets a friendly pointer to the shop. */
export const ASSISTANT_SOON = "Скоро я смогу отвечать на вопросы и подбирать сны прямо здесь. А пока всё есть в магазине — кнопка ниже.";

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
