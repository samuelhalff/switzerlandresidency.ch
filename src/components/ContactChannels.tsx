import { t, type Locale } from "@/lib/i18n";
import { CONTACT_EMAIL, whatsappUrl } from "@/lib/site";
import Button from "./ui/Button";
import Icon from "./ui/Icon";

/** WhatsApp (only if NEXT_PUBLIC_WHATSAPP is set) + email. */
export default function ContactChannels({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap gap-x-6 gap-y-3" : "flex flex-col items-start gap-4"}>
      {whatsappUrl ? (
        <Button
          href={whatsappUrl}
          variant="link"
          target="_blank"
          rel="noopener noreferrer"
          track={{ event: "contact_channel_click", params: { channel: "whatsapp" } }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="currentColor"
            className="mr-2 inline-block align-[-3px]"
          >
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.4-.3Z" />
          </svg>
          {t(locale, "common.whatsapp")}
        </Button>
      ) : null}
      <Button
        href={`mailto:${CONTACT_EMAIL}`}
        variant="link"
        track={{ event: "contact_channel_click", params: { channel: "email" } }}
      >
        <Icon name="mail" size={18} className="mr-2 inline-block align-[-3px]" />
        {t(locale, "common.email")}
      </Button>
    </div>
  );
}
