import { FrappeProvider } from "frappe-react-sdk";
import { ReactNode } from "react";

export default function BackendProvider({ children }: { children: ReactNode }) {
  // FrappeProvider usually needs no props if relying on window.frappe, 
  // or you can pass socketPort/url if needed.
  return <FrappeProvider>{children}</FrappeProvider>;
}