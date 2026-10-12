export default function Loader({ label = "Loading..." }: { label?: string }) {
  return <div className="center">{label}</div>;
}