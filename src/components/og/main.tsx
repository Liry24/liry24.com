import { generate } from './generate';

export const OG = async () => {
    return await generate(layout());
};

const layout = () => {
    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b0b0b',
                fontFamily: '"Inter", sans-serif',
            }}
        >
            <span
                style={{
                    fontFamily: '"Inter", sans-serif',
                    fontSize: '86px',
                    fontWeight: 'light',
                    letterSpacing: '0.5em',
                    color: 'white',
                }}
            >
                Liry24
            </span>
        </div>
    );
};
