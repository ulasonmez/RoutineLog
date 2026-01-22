import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Routine Log',
        short_name: 'RoutineLog',
        description: 'Track your daily routines and habits',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#7c3aed',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}
