import { Icon } from "./Icon";
import styles from "./Stepper.module.css";

/** − value + with a group label. With `removeAtMin` the minus turns into «remove» at the minimum. */
export function Stepper({
  label,
  value,
  min,
  max,
  onChange,
  removeAtMin = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  removeAtMin?: boolean;
}) {
  const removes = removeAtMin && value <= min;
  return (
    <div className={styles.stepper} role="group" aria-label={label}>
      <button type="button" aria-label={removes ? "Убрать" : "Меньше"} disabled={value <= min && !removeAtMin} onClick={() => onChange(value - 1)}>
        <Icon name={removes ? "close" : "minus"} size={18} />
      </button>
      <output aria-live="polite">{value}</output>
      <button type="button" aria-label="Больше" disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}
