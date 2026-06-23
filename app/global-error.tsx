'use client';

export default function GlobalError({
    error,
    reset
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body>
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '1.5rem',
                        fontFamily: 'system-ui, sans-serif'
                    }}
                >
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                        Something went wrong
                    </h2>
                    <p style={{ color: '#666', maxWidth: '28rem', textAlign: 'center' }}>
                        A critical error occurred. Please refresh the page or try
                        again later.
                    </p>
                    <button
                        type="button"
                        onClick={() => reset()}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.375rem',
                            border: '1px solid #ccc',
                            cursor: 'pointer'
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
