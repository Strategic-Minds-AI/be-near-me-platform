import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export default function FreeLimitPopup({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-[#1a1a1a] border-white/10 text-white">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 flex items-center justify-center mb-4">
            <Lock className="text-white" size={28} />
          </div>
          <DialogTitle className="text-2xl font-bold text-white">
            Free Limit Reached
          </DialogTitle>
          <DialogDescription className="text-gray-400 mt-2 text-base">
            You've used your free media kit generation. More credits coming soon!
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <Button
            variant="ghost"
            className="w-full text-gray-400 hover:text-white"
            onClick={() => onClose(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}