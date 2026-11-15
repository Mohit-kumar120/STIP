export default function Badge({ value }) {
  return <span className={`badge b-${value}`}>{value}</span>;
}