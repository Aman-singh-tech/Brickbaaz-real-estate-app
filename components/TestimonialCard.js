/* eslint-disable @next/next/no-img-element */
import { Card } from "@/components/ui";
export default function TestimonialCard({ item: t }) {
  return (
    <Card className="overflow-hidden !p-5">
      <div className="flex items-center gap-3">
        {t.imageUrl && (
          <a href={t.imageUrl} target="_blank" rel="noopener noreferrer">
            <img
              src={t.imageUrl}
              alt={`${t.name} feedback`}
              loading="lazy"
              className="h-16 w-16 rounded-xl object-cover"
            />
          </a>
        )}
        <div>
          <p className="font-bold">{t.name}</p>
          {t.reference && <p className="text-xs text-mute">{t.reference}</p>}
        </div>
      </div>
      <blockquote className="my-5 whitespace-pre-wrap text-sm leading-relaxed text-mute">
        “{t.feedback}”
      </blockquote>
      {t.videoUrl && (
        <video
          src={t.videoUrl}
          controls
          preload="none"
          aria-label={`${t.name} testimonial video`}
          className="aspect-video w-full rounded-xl bg-navy"
        />
      )}
    </Card>
  );
}
