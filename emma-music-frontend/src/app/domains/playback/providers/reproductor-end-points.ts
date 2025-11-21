export const REPRODUCTOR_END_POINTS = {
    estado: (usuarioId: number) => `/api/v1/reproductor/estado/${usuarioId}`,
    reproducir: `/api/v1/reproductor/reproducir`,
    reproducirDesdeBusqueda: `/api/v1/reproductor/reproducir/desde-busqueda`,
    play: `/api/v1/reproductor/play`,
    pause: `/api/v1/reproductor/pause`,
    siguiente: `/api/v1/reproductor/siguiente`,
    anterior: `/api/v1/reproductor/anterior`,
    volumen: `/api/v1/reproductor/volumen`,
    posicion: `/api/v1/reproductor/posicion`,
    favoritoToggle: `/api/v1/reproductor/favorito/toggle`,

    cola: {
        obtener: (usuarioId: number) => `/api/v1/reproductor/cola/${usuarioId}`,
        agregar: `/api/v1/reproductor/cola/agregar`,
        eliminar: `/api/v1/reproductor/cola/eliminar`,
        limpiar: `/api/v1/reproductor/cola/limpiar`,
        reordenar: `/api/v1/reproductor/cola/reordenar`,
        cambiarModo: `/api/v1/reproductor/modo`
    }
};
