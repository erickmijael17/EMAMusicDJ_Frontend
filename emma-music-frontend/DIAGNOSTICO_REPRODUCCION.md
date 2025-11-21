DIAGNÓSTICO Y CORRECCIONES - Módulo de Reproducción

Fecha: 2025-11-19
Estado: CORREGIDO Y MEJORADO

PROBLEMAS IDENTIFICADOS Y CORREGIDOS

1. TIPOS DE RESPUESTA INCORRECTOS

Problema:
Los servicios backend esperaban recibir directamente los DTOs, pero según la
documentación real del backend, muchas respuestas vienen envueltas en objetos
con estructura adicional que incluye mensaje y estado.

Ejemplo de discrepancia:
Backend devuelve: { mensaje: string, esFavorita: boolean, estado: EstadoReproductorDto }
Frontend esperaba: EstadoReproductorDto

Corrección aplicada:
Se crearon nuevas interfaces para representar las respuestas reales:

interface RespuestaToggleFavorito {
    mensaje: string;
    esFavorita: boolean;
    estado: EstadoReproductorDto;
}

interface RespuestaColaOperacion {
    mensaje: string;
    cola: ColaReproduccionDto;
    estado: string;
}

interface RespuestaLimpiarCola {
    mensaje: string;
    estado: string;
}

2. SERVICIO BACKEND - TIPOS INCORRECTOS

Archivos corregidos:
- reproductor-backend.service.ts
- cola-backend.service.ts

Métodos actualizados:

toggleFavorito(usuarioId: number): Observable<RespuestaToggleFavorito>

agregarACola(request: AgregarAColaRequest): Observable<RespuestaColaOperacion>

eliminarCancion(usuarioId, indice): Observable<RespuestaColaOperacion>

limpiarCola(usuarioId: number): Observable<RespuestaLimpiarCola>

reordenarCola(request: ReordenarColaRequest): Observable<RespuestaColaOperacion>

cambiarModo(request: CambiarModoRequest): Observable<RespuestaColaOperacion>

3. SERVICIO INTEGRADO - MANEJO DE RESPUESTAS

Archivo: reproductor-integrado.service.ts

Corrección: Actualizado para extraer los datos correctos de las respuestas envueltas

Antes:
const cola = await firstValueFrom(this.servicioColaBackend.agregarACola(request));
this._colaReproduccion.next(cola);

Después:
const respuesta = await firstValueFrom(this.servicioColaBackend.agregarACola(request));
this._colaReproduccion.next(respuesta.cola);
console.log('[agregarACola] Canciones agregadas:', respuesta.mensaje);

4. LOGS MEJORADOS PARA DIAGNÓSTICO

Se añadieron logs detallados en todos los puntos críticos:

WebSocket - procesarMensajeWebSocket():
Logs detallados de cada tipo de evento
Verificación de presencia de URL de reproducción
Advertencias cuando faltan datos esperados

Reproducción de Audio - cargarYReproducirAudio():
Log de inicio de carga
Log de URL (primeros 100 caracteres)
Log de carga exitosa
Log de inicio de reproducción
Log de error detallado con nombre y mensaje

Carga de Audio - cargarAudio():
Log de cada evento del elemento audio (loadeddata, loadedmetadata, canplay, error)
Log de detalles de error (networkState, readyState, error object)
Log cuando se alcanza el timeout

5. DIAGNÓSTICO DE PROBLEMAS DE REPRODUCCIÓN

Con los logs añadidos, ahora se puede identificar fácilmente:

¿Llega el evento STREAM_LISTO?
Buscar: "[WebSocket] STREAM_LISTO"

¿Tiene URL de reproducción?
Buscar: "[WebSocket] Iniciando reproducción de audio con URL:"

¿Se carga el audio correctamente?
Buscar: "[cargarAudio] loadeddata event"

¿Se inicia la reproducción?
Buscar: "[Audio] Reproducción iniciada exitosamente"

¿Hay errores?
Buscar: "[Audio] Error al reproducir:" o "[cargarAudio] Error event:"

POSIBLES CAUSAS SI NO SE REPRODUCE

1. WebSocket no conectado
Verificar: "[WebSocket] Estado conexión: Conectado"
Solución: Verificar que el WebSocket se conecte correctamente al inicializar

2. No llega evento STREAM_LISTO
Verificar: Buscar "STREAM_LISTO" en logs
Solución: Verificar que el backend esté enviando el evento correctamente

3. URL de reproducción es null
Verificar: "[WebSocket] STREAM_LISTO recibido pero sin URL de reproducción"
Solución: Verificar el procesamiento del stream en el backend

4. Error de CORS
Verificar: "[cargarAudio] Error event:" con error de red
Solución: Configurar CORS en el backend para permitir la URL de reproducción

5. Error de autoplay del navegador
Verificar: "NotAllowedError" o "play() request was interrupted"
Solución: Requiere interacción del usuario antes de reproducir

6. URL de stream expirada
Verificar: Error 403 o 404 al cargar el audio
Solución: Reducir el tiempo entre obtener URL y reproducir

VERIFICACIÓN DE CORRECCIONES

Para verificar que todo funciona correctamente:

1. Abrir DevTools (F12) → Consola

2. Buscar una canción y reproducir

3. Verificar secuencia de logs esperada:

[WebSocket] Procesando mensaje: REPRODUCIENDO
[WebSocket] Procesando mensaje: STREAM_LISTO
[WebSocket] Iniciando reproducción de audio con URL: https://...
[Audio] Iniciando carga de audio...
[cargarAudio] Iniciando carga...
[cargarAudio] Asignando URL al elemento audio
[cargarAudio] load() llamado
[cargarAudio] loadedmetadata event - Metadata cargada
[cargarAudio] canplay event - Audio listo para reproducir
[cargarAudio] loadeddata event - Audio cargado exitosamente
[Audio] Audio cargado exitosamente
[Audio] Intentando reproducir...
[Audio] Reproducción iniciada exitosamente

4. Si hay error, revisar el mensaje de error específico

CÓDIGO DE EJEMPLO PARA COMPONENTE

async reproducirDesdeResultados(cancion: any, indice: number) {
  try {
    console.log('[Componente] Reproduciendo canción:', cancion.titulo);
    
    await this.servicioReproductor.reproducirDesdeBusqueda(
      cancion.idVideo,
      'término de búsqueda',
      indice
    );
    
    console.log('[Componente] Solicitud enviada, esperando WebSocket');
    
  } catch (error) {
    console.error('[Componente] Error:', error);
    this.mostrarError('No se pudo reproducir la canción');
  }
}

SIGUIENTE PASOS

1. Probar la aplicación con ng serve

2. Abrir la consola del navegador

3. Reproducir una canción desde resultados de búsqueda

4. Verificar los logs en la consola

5. Si no se reproduce:
   a. Copiar TODOS los logs de la consola
   b. Identificar dónde se detiene el flujo
   c. Revisar el mensaje de error específico

6. Posibles acciones según el error:
   
   Sin logs de WebSocket:
   Verificar que el WebSocket esté conectado
   
   STREAM_LISTO sin URL:
   Problema en el backend al obtener el stream
   
   Error al cargar audio:
   Problema de CORS o URL inválida
   
   NotAllowedError:
   Requiere interacción del usuario (botón play)
   
   Timeout alcanzado:
   Audio tarda más de 5 segundos en cargar

RESUMEN DE ARCHIVOS MODIFICADOS

1. reproductor-backend.model.ts
   Añadidas interfaces para respuestas envueltas

2. reproductor-backend.service.ts
   Actualizado toggleFavorito para devolver RespuestaToggleFavorito

3. cola-backend.service.ts
   Actualizados todos los métodos para devolver respuestas envueltas

4. reproductor-integrado.service.ts
   Actualizado manejo de respuestas de cola
   Actualizado toggleFavorito
   Añadidos logs detallados en:
   - procesarMensajeWebSocket
   - cargarYReproducirAudio
   - cargarAudio

ESTADO FINAL

Tipos de respuesta: CORREGIDOS
Manejo de respuestas: CORREGIDO
Logs de diagnóstico: AÑADIDOS
Documentación: ACTUALIZADA

La aplicación ahora:
- Maneja correctamente las respuestas del backend
- Tiene logs detallados para diagnosticar problemas
- Muestra claramente dónde falla si hay un problema

Próximo paso: PROBAR Y REVISAR LOGS

