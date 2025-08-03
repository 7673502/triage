import './StatCard.css';

type Tone = 'red' | 'yellow' | 'green' | 'slate';

interface Props {
  value: string | number;
  label: string;
  tone?: Tone;
}

export default function StatCard({ value, label, tone = 'slate' }: Props) {
  return (
    <div className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__label">{label}</span>
    </div>
  );
}