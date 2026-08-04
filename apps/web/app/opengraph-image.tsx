import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'RECI Transport — AI-Powered Vehicle Rental in Berlin'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0F1A0E',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        {/* Green accent bar top-left */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '6px',
            height: '100%',
            backgroundColor: '#407E3C',
          }}
        />

        {/* Decorative circle top-right */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            backgroundColor: '#407E3C',
            opacity: 0.12,
          }}
        />

        {/* Decorative circle bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '180px',
            width: '280px',
            height: '280px',
            borderRadius: '50%',
            backgroundColor: '#407E3C',
            opacity: 0.08,
          }}
        />

        {/* Logo lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#407E3C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '3px solid #ffffff',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            RECI Transport
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: '64px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
            }}
          >
            <span style={{ color: '#ffffff' }}>Vehicle Rental</span>
            <span style={{ color: '#407E3C' }}>in Berlin.</span>
          </div>

          <p
            style={{
              fontSize: '26px',
              color: '#9CA3AF',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Cars · Vans · Trucks — instant booking, 3 pickup locations
          </p>
        </div>

        {/* Bottom badges */}
        <div
          style={{
            marginTop: '40px',
            display: 'flex',
            gap: '16px',
          }}
        >
          {['Insurance included', 'Free cancellation up to 48h', 'Instant confirmation'].map((label) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1C2B1B',
                border: '1px solid #2D4A2C',
                borderRadius: '999px',
                padding: '8px 18px',
              }}
            >
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#407E3C',
                }}
              />
              <span style={{ fontSize: '18px', color: '#D1FAE5', fontWeight: 500 }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
