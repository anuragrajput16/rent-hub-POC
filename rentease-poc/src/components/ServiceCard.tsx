import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function ServiceCard({
  icon,
  title,
  body,
  to,
  linkLabel,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  to: string;
  linkLabel: string;
}) {
  return (
    <div className="card flex flex-col gap-[11px] p-5">
      <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-green-soft text-green [&_svg]:h-[23px] [&_svg]:w-[23px]">
        {icon}
      </span>
      <h3 className="display m-0 text-[16.5px] font-semibold">{title}</h3>
      <p className="m-0 flex-1 text-[13.5px] leading-snug text-muted">{body}</p>
      <Link to={to} className="text-[13.5px] font-semibold text-green no-underline hover:underline">
        {linkLabel} →
      </Link>
    </div>
  );
}
