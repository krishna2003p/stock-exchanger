import AuthPage from "./components/AuthPage";
import { Suspense } from "react";

export default function JoinWithUs() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}