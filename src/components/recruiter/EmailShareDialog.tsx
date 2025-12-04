import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, Send } from 'lucide-react';

interface EmailShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (email: string, message: string) => Promise<void>;
  isLoading: boolean;
}

export function EmailShareDialog({
  open,
  onOpenChange,
  onSend,
  isLoading,
}: EmailShareDialogProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    await onSend(email.trim(), message.trim());
    setEmail('');
    setMessage('');
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#100D0A]">
            <Mail className="w-5 h-5 text-[#93B1FF]" />
            Share Executive Report
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#100D0A]">
              Recipient Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="recipient@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-[#605738]/30 focus:border-[#93B1FF]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-[#100D0A]">
              Personal Message <span className="text-[#605738] text-sm">(optional)</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Add a personal note to accompany the report..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-[#605738]/30 focus:border-[#93B1FF] min-h-[80px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-[#605738]/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isValidEmail(email)}
              className="bg-[#93B1FF] hover:bg-[#7a9ce8] text-[#100D0A] font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
