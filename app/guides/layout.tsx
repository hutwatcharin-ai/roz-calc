// Every /guides page shares one look (app/guides/guides-shell.css, owner,
// 8 Oct 2026): this wrapper scopes it so the rest of the site is untouched.

import './guides-shell.css';
import NaviTapCopy from '@/components/NaviTapCopy';

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="gx">
      {children}
      <NaviTapCopy />
    </div>
  );
}
