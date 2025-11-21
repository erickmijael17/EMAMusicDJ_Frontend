# 📘 Guía de Actualización - Módulo de Reproducción

## Fecha: 2025-11-19
## Autor: Asistente de Desarrollo

---

## 🎯 Objetivo

Actualizar el módulo de reproducción del frontend para que funcione correctamente con la nueva API REST documentada. Los cambios principales incluyen:

1. Modificación de endpoints que ahora usan **POST con body JSON** en lugar de query parameters
2. Actualización del enum de modos de reproducción
3. Simplificación del manejo de favoritos usando el endpoint del reproductor

---

## 📋 Cambios Realizados

### 1. **Modelos de Datos** (`reproductor-backend.model.ts`)

#### Cambio en el Enum `ModoReproduccion`

**Antes:**
```typescript
export enum ModoReproduccion {
    SECUENCIAL = 'SECUENCIAL',
    ALEATORIO = 'ALEATORIO',
    REPETIR_TODAS = 'REPETIR_TODAS',
    REPETIR_UNA = 'REPETIR_UNA'
}
```

**Después:**
```typescript
export enum ModoReproduccion {
    NORMAL = 'NORMAL',
    ALEATORIO = 'ALEATORIO',
    REPETIR_TODAS = 'REPETIR_TODAS',
    REPETIR_UNA = 'REPETIR_UNA'
}
```

**Razón:** El backend ahora usa `NORMAL` en lugar de `SECUENCIAL` para el modo de reproducción estándar.

---

### 2. **Endpoints** (`reproductor-end-points.ts`)

#### Simplificación de URLs

**Antes:**
```typescript
export const REPRODUCTOR_END_POINTS = {
    estado: (usuarioId: number) => `/api/v1/reproductor/estado/${usuarioId}`,
    reproducir: (videoId: string, usuarioId: number) => 
        `/api/v1/reproductor/reproducir/${videoId}?usuarioId=${usuarioId}`,
    reproducirDesdeBusqueda: (usuarioId, videoId, terminoBusqueda, indiceEnBusqueda) =>
        `/api/v1/reproductor/reproducir/desde-busqueda?usuarioId=...`,
    play: (usuarioId: number) => `/api/v1/reproductor/play?usuarioId=${usuarioId}`,
    // ... etc
};
```

**Después:**
```typescript
export const REPRODUCTOR_END_POINTS = {
    estado: (usuarioId: number) => `/api/v1/reproductor/estado/${usuarioId}`,
    reproducir: `/api/v1/reproductor/reproducir`,
    reproducirDesdeBusqueda: `/api/v1/reproductor/reproducir-busqueda`,
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
```

**Razón:** Los endpoints ahora son URLs fijas porque los parámetros se envían en el body JSON, no en la URL.

---

### 3. **Servicio Backend** (`reproductor-backend.service.ts`)

#### Actualización de Métodos

Todos los métodos ahora envían datos en el **body JSON** en lugar de usar query parameters.

**Ejemplo - Método `reproducir`:**

**Antes:**
```typescript
reproducir(videoId: string, usuarioId: number): Observable<EstadoReproductorDto> {
    return this.enviar<EstadoReproductorDto>(
        this._endpoints.reproducir(videoId, usuarioId)
    );
}
```

**Después:**
```typescript
reproducir(videoId: string, usuarioId: number): Observable<EstadoReproductorDto> {
    return this.enviar<EstadoReproductorDto>(
        this._endpoints.reproducir,
        { usuarioId, videoId }
    );
}
```

**Ejemplo - Método `reproducirDesdeBusqueda`:**

**Antes:**
```typescript
reproducirDesdeBusqueda(
    usuarioId: number,
    videoId: string,
    terminoBusqueda: string,
    indiceEnBusqueda: number
): Observable<EstadoReproductorDto> {
    return this.enviar<EstadoReproductorDto>(
        this._endpoints.reproducirDesdeBusqueda(usuarioId, videoId, terminoBusqueda, indiceEnBusqueda)
    );
}
```

**Después:**
```typescript
reproducirDesdeBusqueda(
    usuarioId: number,
    videoId: string,
    terminoBusqueda: string,
    indiceEnBusqueda: number
): Observable<EstadoReproductorDto> {
    return this.enviar<EstadoReproductorDto>(
        this._endpoints.reproducirDesdeBusqueda,
        { usuarioId, videoId, terminoBusqueda, indiceEnBusqueda }
    );
}
```

#### Métodos Actualizados

Todos estos métodos fueron actualizados para enviar body JSON:

- `reproducir(videoId, usuarioId)` - Body: `{ usuarioId, videoId }`
- `reproducirDesdeBusqueda(...)` - Body: `{ usuarioId, videoId, terminoBusqueda, indiceEnBusqueda }`
- `play(usuarioId)` - Body: `{ usuarioId }`
- `pause(usuarioId)` - Body: `{ usuarioId }`
- `siguiente(usuarioId)` - Body: `{ usuarioId }`
- `anterior(usuarioId)` - Body: `{ usuarioId }`
- `cambiarVolumen(usuarioId, volumen)` - Body: `{ usuarioId, volumen }`
- `saltarPosicion(usuarioId, posicionSegundos)` - Body: `{ usuarioId, posicionSegundos }`
- `toggleFavorito(usuarioId)` - Body: `{ usuarioId }`

---

### 4. **Servicio Cola Backend** (`cola-backend.service.ts`)

#### Actualización de Métodos

**Método `eliminarCancion`:**

**Antes:**
```typescript
eliminarCancion(usuarioId: number, indice: number): Observable<ColaReproduccionDto> {
    return this.eliminar<ColaReproduccionDto>(
        this._endpoints.eliminarCancion(usuarioId, indice)
    );
}
```

**Después:**
```typescript
eliminarCancion(usuarioId: number, indice: number): Observable<ColaReproduccionDto> {
    return this.enviar<ColaReproduccionDto>(
        this._endpoints.eliminar,
        { usuarioId, indice }
    );
}
```

**Método `limpiarCola`:**

**Antes:**
```typescript
limpiarCola(usuarioId: number): Observable<void> {
    return this.eliminar<void>(
        this._endpoints.limpiar(usuarioId)
    );
}
```

**Después:**
```typescript
limpiarCola(usuarioId: number): Observable<void> {
    return this.enviar<void>(
        this._endpoints.limpiar,
        { usuarioId }
    );
}
```

**Razón:** Cambiamos de `DELETE` a `POST/DELETE` con body JSON según la nueva especificación de la API.

---

### 5. **Servicio Reproductor Integrado** (`reproductor-integrado.service.ts`)

#### Simplificación del Manejo de Favoritos

**Antes:**
```typescript
import { ServicioFavoritos } from '../../favorites/services/favoritos.service';

export class ServicioReproductorIntegrado {
    private servicioFavoritos = inject(ServicioFavoritos);
    
    async toggleFavorito(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        const estadoActual = this._estadoReproductor.value;

        if (!usuarioId || !estadoActual || !estadoActual.videoIdActual) {
            return;
        }

        const esFavoritoActual = estadoActual.esFavorita || false;

        await firstValueFrom(
            this.servicioFavoritos.alternarFavorito(
                usuarioId,
                estadoActual.videoIdActual,
                esFavoritoActual
            )
        );

        this._estadoReproductor.next({
            ...estadoActual,
            esFavorita: !esFavoritoActual
        });
    }
}
```

**Después:**
```typescript
// Ya no se importa ServicioFavoritos

export class ServicioReproductorIntegrado {
    // Ya no se inyecta ServicioFavoritos
    
    async toggleFavorito(): Promise<void> {
        const usuarioId = this.obtenerUsuarioId();
        const estadoActual = this._estadoReproductor.value;

        if (!usuarioId || !estadoActual || !estadoActual.videoIdActual) {
            console.warn('No se puede cambiar favorito: falta información');
            return;
        }

        try {
            const nuevoEstado = await firstValueFrom(
                this.servicioReproductorBackend.toggleFavorito(usuarioId)
            );

            this._estadoReproductor.next(nuevoEstado);

            console.log('[toggleFavorito] Favorito cambiado exitosamente:', {
                videoId: nuevoEstado.videoIdActual,
                esFavorita: nuevoEstado.esFavorita
            });
        } catch (error) {
            console.error('Error al cambiar favorito:', error);
        }
    }
}
```

**Ventajas:**
- ✅ Código más simple y directo
- ✅ Una sola fuente de verdad (el backend maneja el estado)
- ✅ El backend responde con el estado actualizado completo
- ✅ No necesitamos pasar el estado actual como parámetro

---

## 🔄 Flujo de Datos Actualizado

### Flujo de Reproducción con WebSocket

```
1. Usuario hace clic en "Reproducir"
   ↓
2. Frontend llama a: reproducir(videoId, usuarioId)
   POST /api/v1/reproductor/reproducir
   Body: { usuarioId: 1, videoId: "abc123" }
   ↓
3. Backend responde inmediatamente con estado inicial:
   {
     videoIdActual: "abc123",
     tituloActual: "Cargando...",
     estaReproduciendo: true,
     ...
   }
   ↓
4. Frontend muestra spinner de carga
   ↓
5. Backend procesa el stream de YouTube (2-5 segundos)
   ↓
6. WebSocket envía evento STREAM_LISTO:
   {
     tipoEvento: "STREAM_LISTO",
     estadoReproductor: {
       videoIdActual: "abc123",
       tituloActual: "Canción Real",
       urlReproduccion: "https://...",
       duracionSegundos: 230,
       ...
     }
   }
   ↓
7. Frontend recibe el evento y reproduce el audio
   this.audio.src = estado.urlReproduccion
   this.audio.play()
```

---

## ✅ Beneficios de los Cambios

### 1. **Consistencia con REST**
- Todos los métodos POST ahora usan body JSON
- URLs más limpias y simples
- Mejor seguimiento de estándares REST

### 2. **Simplificación del Código**
- Menos dependencias (eliminamos ServicioFavoritos del reproductor)
- Código más fácil de mantener
- Menos lógica duplicada

### 3. **Mejor Manejo de Estado**
- El backend es la única fuente de verdad
- El frontend solo refleja el estado que recibe
- Menos posibilidad de inconsistencias

### 4. **WebSocket Optimizado**
- Actualizaciones en tiempo real funcionando correctamente
- Manejo apropiado de eventos asíncronos
- Feedback visual mientras se procesa el stream

---

## 🧪 Pruebas Recomendadas

### 1. Reproducción Básica
```typescript
// Reproducir una canción
await reproductor.reproducir('videoId123');
// Verificar que el estado inicial tenga "Cargando..."
// Esperar evento WebSocket STREAM_LISTO
// Verificar que el audio empiece a reproducirse
```

### 2. Reproducción desde Búsqueda
```typescript
// Reproducir desde resultados de búsqueda
await reproductor.reproducirDesdeBusqueda(
    'videoId123',
    'justin bieber',
    0
);
// Verificar que se carguen 20 canciones en la cola
```

### 3. Control de Favoritos
```typescript
// Toggle favorito
await reproductor.toggleFavorito();
// Verificar que el estado se actualice correctamente
// Verificar que no haya llamadas al ServicioFavoritos antiguo
```

### 4. Cambio de Modo
```typescript
// Cambiar a modo aleatorio
await reproductor.cambiarModo(ModoReproduccion.ALEATORIO);
// Cambiar a modo repetir todas
await reproductor.cambiarModo(ModoReproduccion.REPETIR_TODAS);
// Verificar que el backend responda correctamente
```

---

## 📝 Notas Importantes

### Retrocompatibilidad
- ⚠️ Estos cambios **NO son retrocompatibles** con la versión anterior del backend
- Asegúrate de que el backend esté actualizado antes de desplegar estos cambios
- Coordina el deployment de frontend y backend

### Ambiente de Desarrollo
```typescript
// environment.ts
export const environment = {
    production: false,
    apiUrl: 'http://localhost:8080',
    wsUrl: 'ws://localhost:8080/ws'
};
```

### WebSocket
- El WebSocket se conecta automáticamente al inicializar el reproductor
- Se reconecta automáticamente si se pierde la conexión (máximo 5 intentos)
- Los mensajes se logean en la consola para debugging

---

## 🐛 Troubleshooting

### Problema: "El audio no se reproduce después del evento STREAM_LISTO"
**Solución:** Verifica que `urlReproduccion` no sea `null` en el mensaje WebSocket

### Problema: "Error 400 - Bad Request"
**Solución:** Verifica que el body JSON tenga todos los campos requeridos

### Problema: "WebSocket no se conecta"
**Solución:** 
1. Verifica que el backend esté corriendo
2. Verifica la URL del WebSocket en `environment.ts`
3. Revisa la consola del navegador para más detalles

### Problema: "Favorito no se actualiza"
**Solución:** 
1. Verifica que el usuario esté autenticado
2. Verifica que haya una canción actualmente reproduciéndose
3. Revisa los logs del backend

---

## 📚 Recursos Adicionales

- [Documentación de la API REST](./API_DOCUMENTATION.md) - Documentación completa de todos los endpoints
- [Guía de WebSocket](./WEBSOCKET_GUIDE.md) - Manejo de eventos en tiempo real
- [Especificación de DTOs](./src/app/domains/playback/models/reproductor-backend.model.ts) - Modelos de datos

---

## 👥 Contacto

Para dudas o problemas con estos cambios, contacta al equipo de backend o revisa los logs de la aplicación.

**Fecha de última actualización:** 2025-11-19

