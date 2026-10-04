import { Link, useLocation } from "react-router-dom";
import { SearchX } from "lucide-react";
import {
  BnmLockedScreen,
  EmptyState,
  GradientButton,
} from "@/components/bnm/LockedShell";

export default function PageNotFound() {
  const location = useLocation();

  return (
    <BnmLockedScreen>
      <div className="px-3 pt-8">
        <EmptyState
          icon={SearchX}
          title="Page not found"
          body={
            'The Be Near Me page "' +
            (location.pathname || "/") +
            '" is not available.'
          }
        />
        <div className="mt-4 text-center">
          <Link to="/home">
            <GradientButton>Go to Home</GradientButton>
          </Link>
        </div>
      </div>
    </BnmLockedScreen>
  );
}
