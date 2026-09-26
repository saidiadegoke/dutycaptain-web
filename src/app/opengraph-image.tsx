import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/seo';

/** The link-preview image for every page (1200×630, the size platforms expect). */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: '#0b1220',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: '#2456d8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            
            <svg width="40" height="40" viewBox="0 0 64 64">
              <path d="M12 34h9l5-12 8 22 6-15 3 5h9" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, maxWidth: 980 }}>
            Describe the task. DutyCaptain does the work.
          </div>
          <div style={{ fontSize: 30, color: '#9fb0cc', maxWidth: 960, lineHeight: 1.35 }}>
            Planned, carried out by the most reliable route, checked — and it asks before anything that matters.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 28, fontSize: 24, color: '#9fb0cc' }}>
          <span>Built-in tools</span>
          <span>·</span>
          <span>Connected services</span>
          <span>·</span>
          <span>Websites</span>
          <span>·</span>
          <span>Your computer</span>
        </div>
      </div>
    ),
    size
  );
}
