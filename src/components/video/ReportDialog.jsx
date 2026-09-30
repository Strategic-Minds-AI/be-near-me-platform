import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Loader2 } from "lucide-react";

const reportReasons = [
  { value: "spam", label: "Spam or misleading" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hateful or abusive content" },
  { value: "violence", label: "Violent or dangerous content" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "misinformation", label: "Misinformation" },
  { value: "copyright", label: "Copyright infringement" },
  { value: "other", label: "Other" },
];

export default function ReportDialog({ 
  open, 
  onOpenChange, 
  targetType, 
  targetId,
  targetTitle 
}) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const reportMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Report.create({
        target_type: targetType,
        target_id: targetId,
        reason,
        details,
        status: "pending",
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setReason("");
        setDetails("");
      }, 2000);
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setSubmitted(false);
    setReason("");
    setDetails("");
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-[#212121] border-white/10">
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Report Submitted</h3>
            <p className="text-gray-400">
              Thank you for helping keep our community safe. We'll review your report.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#212121] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Report {targetType}</DialogTitle>
          <DialogDescription>
            {targetTitle && (
              <span className="line-clamp-1">"{targetTitle}"</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-white mb-3 block">Why are you reporting this?</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
              {reportReasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="text-gray-300 cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {reason && (
            <div>
              <Label className="text-white mb-2 block">Additional details (optional)</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide more context about the issue..."
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                maxLength={500}
              />
              <p className="text-gray-500 text-xs mt-1">{details.length}/500</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} className="text-gray-400">
            Cancel
          </Button>
          <Button
            onClick={() => reportMutation.mutate()}
            disabled={!reason || reportMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {reportMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}