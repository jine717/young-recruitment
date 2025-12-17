# NEW WORKFLOW - Business Case Questions Video Implementation

## Resumen Ejecutivo

Este documento detalla la implementación del nuevo workflow para Business Case Questions (BCQ) separando la aplicación inicial de la evaluación mediante video, añadiendo tracking de tiempos y análisis de IA.

---

## **FASE 1: Modificación del Formulario de Aplicación** ✅ IN PROGRESS
**Duración estimada: 1-2 días**

### 1.1 Cambios en `src/pages/Apply.tsx`
- [x] **Eliminar** la sección de Business Case Questions del formulario
- [x] **Eliminar** la validación de respuestas BCQ obligatorias
- [x] **Modificar** el estado de la aplicación creada:
  - `business_case_completed: false` (en lugar de `true`)
  - `business_case_completed_at: null`
- [x] **Eliminar** la inserción de `business_case_responses` en el submit
- [x] **NO ejecutar** `analyze-candidate` al aplicar (se moverá a después de completar BCQ)

### 1.2 Cambios en Base de Datos (Siguiente paso)
Añadir nuevas columnas a `applications`:
```sql
ALTER TABLE applications ADD COLUMN bcq_invitation_sent_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN bcq_link_opened_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN bcq_started_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN bcq_completed_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN bcq_response_time_minutes INTEGER;
ALTER TABLE applications ADD COLUMN bcq_delayed BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN bcq_access_token UUID;
```

### 1.3 Resultado
- Los candidatos aplican solo con: Nombre, Email, CV, DISC
- La aplicación aparece en el dashboard como "New" sin BCQ completado
- El AI Score no se calcula hasta completar BCQ

---

## **FASE 2: Sistema de Invitación por Email para BCQ**
**Duración estimada: 2-3 días**

### 2.1 Nuevo Template de Email
Añadir a `send-notification` edge function:
- **Tipo:** `bcq_invitation`
- **Contenido:** 
  - Mensaje de bienvenida
  - Enlace único: `/bcq/{applicationId}/{token}`
  - Instrucciones sobre formato video en inglés
  - Recordatorio que será transcrito

### 2.2 Generación de Token Seguro
- Usar columna `bcq_access_token` en `applications`
- Generar token único UUID al enviar invitación
- Token válido solo para esa aplicación

### 2.3 Trigger Automático
Modificar `src/pages/Apply.tsx` para:
1. Crear la aplicación
2. **Automáticamente** enviar email de invitación BCQ
3. Guardar `bcq_invitation_sent_at`

### 2.4 Template de Reminder (24h) - Opcional
- **Tipo:** `bcq_reminder`
- Se enviará si no completan en 24h
- Edge function cron o trigger manual

---

## **FASE 3: Nueva Página de Respuesta BCQ en Video**
**Duración estimada: 4-5 días**

### 3.1 Nueva Ruta y Página
Crear `src/pages/BusinessCasePortal.tsx`:
- Ruta: `/bcq/:applicationId/:token`
- Validar token antes de mostrar contenido
- Registrar `bcq_link_opened_at` al cargar

### 3.2 Interfaz de Preguntas (1 por 1)
- Mostrar una pregunta a la vez
- Navegación: Anterior / Siguiente
- Progress bar visual
- **Registrar** `bcq_started_at` al iniciar primera respuesta

### 3.3 Componente de Grabación de Video
Crear `src/components/bcq/VideoRecorder.tsx`:
- Captura de video desde cámara
- Límite de tiempo por pregunta (ej: 3 minutos)
- Preview antes de confirmar
- Botón "Re-grabar" si no satisfecho

### 3.4 Upload de Video
- Subir a bucket `business-case-videos`
- Mostrar progreso de upload
- Guardar URL en `business_case_responses.video_url`

### 3.5 Transcripción Automática
Al guardar cada respuesta:
1. Enviar video a `transcribe-video` edge function
2. Guardar transcripción en `business_case_responses.text_response`
3. Idioma forzado: `language: 'en'` (inglés)

### 3.6 Finalización
Al completar todas las preguntas:
1. Calcular `bcq_response_time_minutes` (desde `bcq_link_opened_at`)
2. Marcar `business_case_completed: true`
3. Guardar `bcq_completed_at`
4. Mostrar pantalla de confirmación

---

## **FASE 4: Tracking de Tiempo y Estado "Delayed"**
**Duración estimada: 1-2 días**

### 4.1 Cálculo de Delayed
- Si `bcq_completed_at - bcq_invitation_sent_at > 24 horas`:
  - Marcar `bcq_delayed: true`
- Implementar en el submit de BCQ Portal

### 4.2 Mostrar en Dashboard
Modificar `src/pages/RecruiterDashboard.tsx`:
- Nueva columna o badge: "BCQ Status"
- Estados posibles:
  - 🟡 "Pending" (invitación enviada, no completado)
  - 🟢 "Completed" (en tiempo)
  - 🔴 "Delayed" (>24h)
  - ⏱️ Mostrar "Response Time: Xh Ym"

### 4.3 Filtros de Dashboard
- Añadir filtro por BCQ status
- Permitir ordenar por tiempo de respuesta

---

## **FASE 5: Email de Confirmación Post-BCQ**
**Duración estimada: 1 día**

### 5.1 Nuevo Template de Email
Añadir a `send-notification`:
- **Tipo:** `bcq_completed`
- **Contenido:**
  - Confirmación de recepción
  - "Tu aplicación será revisada por el equipo de recruitment"
  - Próximos pasos

### 5.2 Trigger Automático
En `BusinessCasePortal.tsx`, al completar:
1. Enviar notificación `bcq_completed`
2. Registrar en `notification_logs`

---

## **FASE 6: Reorganización de Tabs en Candidate Profile**
**Duración estimada: 2-3 días**

### 6.1 Nueva Estructura de Tabs
Modificar `src/pages/CandidateProfile.tsx`:
- **Tab "Overview"**: AI Evaluation, CV & DISC Analysis (sin BCQ)
- **Tab "BCQ"** (NUEVO): Business Case Questions con videos
- **Tab "Interview"**: Interview Questions + Schedule

### 6.2 Nuevo Componente BCQ Tab
Crear `src/components/candidate-profile/BCQTab.tsx`:
- Lista de preguntas con sus respuestas en video
- Mostrar información de timing:
  - "Invitation sent: [fecha]"
  - "Completed: [fecha]"
  - "Response time: [Xh Ym]"
  - Badge "Delayed" si aplica

---

## **FASE 7: Visualización de Videos y Transcripción**
**Duración estimada: 2-3 días**

### 7.1 Componente de Video Player
Crear `src/components/candidate-profile/BCQResponseCard.tsx`:
- Video player embebido
- Transcripción debajo del video
- Badge de estado de transcripción

### 7.2 Layout por Pregunta
Para cada Business Case Question:
```
┌─────────────────────────────────────┐
│ Question 1: [Título]                │
│ [Descripción de la pregunta]        │
├─────────────────────────────────────┤
│ 🎥 [Video Player]                   │
├─────────────────────────────────────┤
│ 📝 Transcription:                   │
│ "[Texto transcrito...]"             │
├─────────────────────────────────────┤
│ 🤖 [Analyze with AI] Button         │
│ AI Analysis (si existe):            │
│ - Response quality                  │
│ - English fluency                   │
│ - Key points                        │
└─────────────────────────────────────┘
```

---

## **FASE 8: Análisis de IA para BCQ**
**Duración estimada: 3-4 días**

### 8.1 Nueva Edge Function `analyze-bcq-response`
- Recibe: `application_id`, `business_case_id`
- Analiza:
  - **Calidad de respuesta**: relevancia, profundidad, estructura
  - **Fluidez en inglés**: gramática, vocabulario, coherencia
  - **Puntos clave identificados**
  - **Puntuación** (0-100) por respuesta

### 8.2 Almacenamiento de Análisis
Crear tabla `bcq_analyses`:
```sql
CREATE TABLE bcq_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_case_response_id UUID REFERENCES business_case_responses(id),
  response_quality_score INTEGER,
  english_fluency_score INTEGER,
  key_points TEXT[],
  analysis_summary TEXT,
  raw_ai_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 8.3 Botón "Analyze with AI" en UI
- Trigger individual por respuesta
- Loading state durante análisis
- Mostrar resultados inline después del análisis

---

## **FASE 9: AI Score Integrado Post-BCQ**
**Duración estimada: 2-3 días**

### 9.1 Modificar Trigger de AI Score
Cambiar lógica para que `analyze-candidate`:
- **NO** se ejecute al aplicar
- **SÍ** se ejecute automáticamente al completar BCQ

### 9.2 Modificar Edge Function `analyze-candidate`
Actualizar para incluir en el análisis:
- CV Analysis
- DISC Analysis
- **BCQ Responses** (nuevo):
  - Videos/transcripciones
  - Análisis de IA de cada respuesta (si existe)
  - Puntuaciones de fluidez en inglés
  - Calidad de respuestas

### 9.3 Ponderación del AI Score
```
AI Score = weighted average of:
- CV Analysis (30%)
- DISC Analysis (20%)
- BCQ Quality Average (30%)
- English Fluency Average (20%)
```

### 9.4 Dashboard Update
- AI Score solo visible cuando BCQ completado
- Mostrar "Pending BCQ" si no completado

---

## **FASE 10: Testing y Refinamiento**
**Duración estimada: 2-3 días**

### 10.1 Testing E2E
1. Aplicar a un puesto (sin BCQ)
2. Recibir email de invitación
3. Acceder al portal BCQ
4. Grabar videos para cada pregunta
5. Verificar transcripción
6. Verificar email de confirmación
7. Verificar aparición en dashboard con timing
8. Verificar análisis de IA
9. Verificar AI Score final

### 10.2 Edge Cases
- Navegador sin permisos de cámara
- Conexión lenta para upload
- Token expirado/inválido
- Respuestas parciales (abandonar a mitad)

---

## **Resumen de Archivos a Crear/Modificar**

### Nuevos Archivos:
| Archivo | Descripción |
|---------|-------------|
| `src/pages/BusinessCasePortal.tsx` | Portal para responder BCQ en video |
| `src/components/bcq/VideoRecorder.tsx` | Grabación de video |
| `src/components/bcq/QuestionNavigator.tsx` | Navegación entre preguntas |
| `src/components/candidate-profile/BCQTab.tsx` | Tab BCQ en perfil |
| `src/components/candidate-profile/BCQResponseCard.tsx` | Card de respuesta con video |
| `src/hooks/useBCQPortal.ts` | Hook para portal BCQ |
| `supabase/functions/analyze-bcq-response/index.ts` | Análisis IA de respuesta |

### Archivos a Modificar:
| Archivo | Cambios |
|---------|---------|
| `src/pages/Apply.tsx` | Eliminar BCQ, cambiar flags |
| `src/pages/CandidateProfile.tsx` | Añadir Tab BCQ |
| `src/pages/RecruiterDashboard.tsx` | Añadir columna BCQ status |
| `supabase/functions/send-notification/index.ts` | Nuevos templates |
| `supabase/functions/analyze-candidate/index.ts` | Incluir BCQ analysis |

### Migraciones de Base de Datos:
1. Añadir columnas BCQ tracking a `applications`
2. Crear tabla `bcq_analyses`

---

## **Timeline Estimado Total: 3-4 semanas**

| Fase | Duración | Dependencias | Estado |
|------|----------|--------------|--------|
| Fase 1 | 1-2 días | - | ✅ IN PROGRESS |
| Fase 2 | 2-3 días | Fase 1 | ⏳ Pending |
| Fase 3 | 4-5 días | Fase 2 | ⏳ Pending |
| Fase 4 | 1-2 días | Fase 3 | ⏳ Pending |
| Fase 5 | 1 día | Fase 3 | ⏳ Pending |
| Fase 6 | 2-3 días | Fase 1 | ⏳ Pending |
| Fase 7 | 2-3 días | Fase 6 | ⏳ Pending |
| Fase 8 | 3-4 días | Fase 7 | ⏳ Pending |
| Fase 9 | 2-3 días | Fase 8 | ⏳ Pending |
| Fase 10 | 2-3 días | Todas | ⏳ Pending |

---

## **Notas Importantes**

1. **Idioma**: Todo el proceso de grabación y transcripción será en inglés para facilitar el análisis de IA
2. **Backward Compatibility**: Las aplicaciones existentes con BCQ texto seguirán funcionando
3. **Storage**: Los videos se almacenan en bucket `business-case-videos` ya existente
4. **Transcription**: Utilizar `transcribe-video` edge function existente
