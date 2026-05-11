import { ExternalLink, PlayCircle, BookOpen } from 'lucide-react';
import { usePublishedLearningMaterials } from '../../api/learning/useLearningMaterialQueries';
import { resolveLearningMaterialThumbnailSrc } from '../../api/learning/learningMaterialThumbnail';
import { LEARNING_CENTER_CATEGORIES } from '../../api/learning/learningMaterialTypes';
import type { LearningMaterialDto } from '../../api/learning/learningMaterialTypes';

export interface LearningCenterMaterialsViewProps {
  theme: 'light' | 'dark';
  /** Path segment under learning-center, e.g. watch-tutorials */
  category: string;
}

function excerpt(text: string | null, max = 180): string {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

export function LearningCenterMaterialsView({ theme, category }: LearningCenterMaterialsViewProps) {
  const isDark = theme === 'dark';
  const { data, isLoading, isError, error } = usePublishedLearningMaterials(category);

  const categoryLabel =
    LEARNING_CENTER_CATEGORIES.find((c) => c.value === category)?.label ?? category.replace(/-/g, ' ');

  const items: LearningMaterialDto[] = Array.isArray(data?.data) ? data!.data : [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className={`text-lg font-semibold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{categoryLabel}</h2>
        <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Curated by your platform team. Select a card to open the video in a new tab.
        </p>
      </div>

      {isLoading && (
        <div className={`rounded-xl border px-4 py-8 text-center text-sm ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
          Loading materials…
        </div>
      )}

      {isError && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${isDark ? 'border-red-900/60 bg-red-950/30 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}
          role="alert"
        >
          {error?.response?.data?.message ?? error?.message ?? 'Could not load learning materials.'}
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <div
          className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-600'}`}
        >
          <BookOpen className={`mb-3 h-10 w-10 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} aria-hidden />
          <p className="text-sm font-medium">No materials published for this section yet.</p>
          <p className="mt-1 max-w-md text-xs">Check back soon, or ask a platform administrator to add videos in Platform Administration.</p>
        </div>
      )}

      {!isLoading && !isError && items.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => {
            const thumbSrc = resolveLearningMaterialThumbnailSrc(m);
            return (
            <li key={m.uuid}>
              <article
                className={`flex h-full flex-col overflow-hidden rounded-xl border transition-shadow ${isDark ? 'border-gray-700 bg-gray-900/50 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10' : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'}`}
              >
                <a
                  href={m.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative block aspect-video w-full overflow-hidden bg-black/5 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`Watch video: ${m.title}`}
                >
                  {thumbSrc ? (
                    <img
                      src={thumbSrc}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                      <PlayCircle className={`h-14 w-14 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} aria-hidden />
                    </div>
                  )}
                  <span
                    className={`absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-gray-900 shadow'}`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    Watch
                  </span>
                </a>

                {m.banner_image_url ? (
                  <div className="border-t border-black/5 px-3 pt-3">
                    <img
                      src={m.banner_image_url}
                      alt=""
                      className="max-h-24 w-full rounded-lg object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                ) : null}

                <div className="flex flex-1 flex-col p-4">
                  <h3 className={`text-base font-semibold leading-snug ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {m.title}
                  </h3>
                  {m.description ? (
                    <p className={`mt-2 flex-1 text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {excerpt(m.description)}
                    </p>
                  ) : null}
                  <div className="mt-3">
                    <a
                      href={m.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 text-sm font-semibold ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      Open video
                      <ExternalLink className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default LearningCenterMaterialsView;
