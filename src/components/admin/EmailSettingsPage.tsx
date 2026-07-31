import { Download, Send } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  getEmailSettings,
  getSubscribers,
  saveEmailSettings,
  sendTestEmail,
  type EmailSettings,
} from "@/services/email";

const blank: EmailSettings = {
  sender_name: "QYVERO",
  sender_email: "",
  reply_to: "",
};

export function EmailSettingsPage() {
  const client = useQueryClient();

  const { data } = useQuery({
    queryKey: ["email", "settings"],
    queryFn: getEmailSettings,
  });

  const [settings, setSettings] = useState(blank);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveEmailSettings(settings),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["email", "settings"] });
      toast.success("Email settings saved");
    },
    onError: (error) =>
      toast.error("Unable to save email settings", {
        description: error.message,
      }),
  });

  const test = useMutation({
    mutationFn: () => sendTestEmail(testEmail),
    onSuccess: () => {
      toast.success("Test email sent");
    },
    onError: (error) =>
      toast.error("Unable to send test email", {
        description: error.message,
      }),
  });

  const exportSubscribers = async () => {
    try {
      const subscribers = await getSubscribers();

      const csv = [
        "Email,Subscribed At,Active",
        ...subscribers.map((item) => `${item.email},${item.subscribed_at},${item.is_active}`),
      ].join("\n");

      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      link.download = "qyvero-newsletter-subscribers.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      toast.error("Unable to export subscribers", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <AdminLayout
      title="Email Settings"
      description="Configure QYVERO notifications and subscribers"
    >
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Sender identity</h2>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <div>
              <Label>Sender name</Label>

              <Input
                className="mt-2"
                value={settings.sender_name}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    sender_name: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label>Sender email</Label>

              <Input
                className="mt-2"
                type="email"
                placeholder="orders@qyvero.com"
                value={settings.sender_email}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    sender_email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Label>Reply-to email</Label>

              <Input
                className="mt-2"
                type="email"
                value={settings.reply_to}
                onChange={(e) =>
                  setSettings((current) => ({
                    ...current,
                    reply_to: e.target.value,
                  }))
                }
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
          <h2 className="font-medium">Test email</h2>

          <div className="mt-5 flex gap-3">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />

            <Button
              type="button"
              variant="outline"
              disabled={test.isPending || !testEmail}
              onClick={() => test.mutate()}
            >
              <Send className="mr-2 h-4 w-4" />
              {test.isPending ? "Sending..." : "Send test"}
            </Button>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save settings"}
          </Button>

          <Button type="button" variant="outline" onClick={() => void exportSubscribers()}>
            <Download className="mr-2 h-4 w-4" />
            Export subscribers
          </Button>
        </div>
      </form>
    </AdminLayout>
  );
}
