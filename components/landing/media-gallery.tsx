import Image from "next/image";
import { Video } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";

/**
 * Campus media section: the photograph gallery and the two campus clips.
 *
 * Photographs are laid out as a CSS multi-column flow rather than a fixed grid
 * because the source files mix portrait and landscape aspect ratios; a uniform
 * grid would either crop most of them or leave the rows ragged. Intrinsic
 * width/height are declared so the browser reserves the right box before the
 * bytes arrive, which keeps layout shift at zero.
 *
 * The clips are click-to-play with `preload="none"`, so a visitor downloads
 * nothing until they press play. They are 14.7 MB and 5.6 MB, which is a poor
 * thing to push to every visitor on mobile data.
 *
 * Alt text on the gallery is intentionally empty: the files arrived without
 * EXIF, source URLs or any description, so the images are treated as
 * decorative. Replace `alt=""` with real descriptions once they are known.
 */

type Photo = {
  src: string;
  width: number;
  height: number;
};

const PHOTOS: Photo[] = [
  { src: "/images/gallery-01.jpg", width: 360, height: 640 },
  { src: "/images/gallery-02.jpg", width: 186, height: 270 },
  { src: "/images/gallery-03.jpg", width: 168, height: 300 },
  { src: "/images/gallery-04.jpg", width: 335, height: 597 },
  { src: "/images/gallery-05.jpg", width: 399, height: 501 },
  { src: "/images/gallery-06.jpg", width: 371, height: 539 },
  { src: "/images/gallery-07.jpg", width: 335, height: 597 },
  { src: "/images/gallery-08.jpg", width: 168, height: 300 },
  { src: "/images/gallery-09.jpg", width: 600, height: 333 },
  { src: "/images/gallery-10.jpg", width: 192, height: 144 },
  { src: "/images/gallery-11.jpg", width: 335, height: 597 },
];

/** Unverified content: see the note above before publishing captions. */
const VIDEOS = [
  { src: "/videos/video-01.mp4", label: "Video 1" },
  { src: "/videos/video-02.mp4", label: "Video 2" },
];

/**
 * Rendered width of one photo, matching the column counts below:
 * 1 column under 640px, 2 to 1023px, 3 to 1279px, then 4 columns inside a
 * max-w-6xl (1152px) container, which works out to a fixed 276px.
 */
const PHOTO_SIZES =
  "(min-width: 1280px) 276px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 100vw";

export function CampusMedia() {
  return (
    <section id="campus-life" className="scroll-mt-20 bg-white py-16 md:py-24 dark:bg-card">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <SectionHeading tag="Campus Life" title="A look around the campus" />

        <div className="mt-12 gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3 xl:columns-4">
          {PHOTOS.map((p) => (
            <Image
              key={p.src}
              src={p.src}
              alt=""
              width={p.width}
              height={p.height}
              sizes={PHOTO_SIZES}
              className="mb-4 block w-full rounded-md break-inside-avoid"
            />
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {VIDEOS.map((v) => (
            <figure
              key={v.src}
              className="overflow-hidden rounded-md border border-border bg-[#F9FAFB] dark:bg-background"
            >
              {/* No poster frame: there is no ffmpeg on this machine to extract
                  one, and borrowing a gallery photo would misrepresent the
                  clip. Native controls give play, pause and seek. */}
              <video
                controls
                preload="none"
                playsInline
                aria-label={v.label}
                className="aspect-video w-full bg-[#0F172A]"
              >
                <source src={v.src} type="video/mp4" />
                Your browser cannot play this video.
              </video>
              <figcaption className="flex items-center gap-2 border-t border-border px-4 py-3 text-sm font-medium">
                <Video className="h-4 w-4 text-[#990000] dark:text-[#c1121f]" />
                {v.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
