import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

/**
 * Shows a product/service completeness badge.
 * missing: string[] of missing field labels
 */
export default function CompletenessBadge({ missing = [], compact = false }) {
    const complete = missing.length === 0;
    if (compact) {
        return complete ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
        ) : (
            <AlertCircle className="h-4 w-4 text-amber-500" />
        );
    }
    return (
        <div>
            {complete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold px-2 py-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Complete
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5" title={missing.join(", ")}>
                    <AlertCircle className="h-3 w-3" /> {missing.length} missing
                </span>
            )}
        </div>
    );
}