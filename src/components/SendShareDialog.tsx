import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MessageCircle, Printer } from "lucide-react";
import { openWhatsApp, printHTML } from "@/lib/share-utils";

export type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Mensagem padrão para WhatsApp (editável pelo profissional). */
  defaultMessage: string;
  /** HTML completo a imprimir em PDF. */
  printHtml: string;
  printTitle: string;
};

export function SendShareDialog({
  open,
  onOpenChange,
  title,
  defaultMessage,
  printHtml,
  printTitle,
}: ShareDialogProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);

  // Reset message when defaultMessage changes (new template/diet)
  if (open && message === "" && defaultMessage) setMessage(defaultMessage);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Edite a mensagem antes de enviar. O WhatsApp abre na sua conta — você escolhe o
            contato ou usa uma conversa aberta. Para imprimir em PDF, escolha
            <strong> Salvar como PDF</strong> no diálogo de impressão.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="wa-phone" className="text-xs">
              Telefone do paciente (opcional)
            </Label>
            <Input
              id="wa-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(91) 9XXXX-XXXX  ·  ou deixe vazio p/ escolher contato"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="wa-msg" className="text-xs">
              Mensagem
            </Label>
            <Textarea
              id="wa-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1 min-h-[180px] font-mono text-xs"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => printHTML({ title: printTitle, html: printHtml })}
          >
            <Printer className="size-4" /> Imprimir / PDF
          </Button>
          <Button
            onClick={() => {
              openWhatsApp({ phone, message });
              onOpenChange(false);
            }}
            className="bg-[#25D366] hover:bg-[#1ebe57] text-white"
          >
            <MessageCircle className="size-4" /> Enviar WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
