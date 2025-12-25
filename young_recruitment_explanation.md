# Young Recruitment - Documentación Completa / Complete Documentation

---

# 🇪🇸 VERSIÓN EN ESPAÑOL

---

## 1. Introducción

**Young Recruitment** es una plataforma integral de gestión de talento impulsada por Inteligencia Artificial que revoluciona el proceso de selección de personal. Diseñada para empresas que buscan optimizar sus procesos de contratación, la plataforma automatiza las tareas más tediosas del reclutamiento mientras mantiene la calidad y el toque humano en las decisiones finales.

### Problema que Resuelve

El reclutamiento tradicional presenta múltiples desafíos:
- **Alto consumo de tiempo**: Un recruiter dedica 15-30 minutos por CV en screening inicial
- **Inconsistencia en evaluaciones**: Diferentes evaluadores, diferentes criterios
- **Sesgos inconscientes**: Decisiones influenciadas por factores no relevantes
- **Escalabilidad limitada**: Difícil manejar picos de contratación
- **Pérdida de talento**: Procesos lentos hacen que los mejores candidatos acepten otras ofertas

Young Recruitment soluciona estos problemas mediante automatización inteligente y análisis con IA.

---

## 2. Funcionalidades Principales

### 2.1 Portal de Empleo Público

#### Listado de Vacantes (`/jobs`)
- Visualización atractiva de todas las posiciones abiertas
- Filtros por departamento, tipo de contrato y ubicación
- Diseño responsive optimizado para móviles
- SEO optimizado para atraer candidatos orgánicamente

#### Página de Detalle de Posición (`/jobs/:id`)
- Descripción completa del puesto
- Requisitos y responsabilidades
- Beneficios ofrecidos
- Botón de aplicación directo

#### Formulario de Aplicación (`/apply/:id`)
- Datos personales del candidato
- Subida de CV (PDF)
- Subida de perfil DISC (opcional)
- Validación en tiempo real
- Confirmación automática por email

### 2.2 Dashboard del Recruiter

El centro de control para gestionar todo el proceso de selección:

#### Panel Principal
- **Vista de aplicaciones**: Tabla completa con todos los candidatos
- **Filtros avanzados**: Por estado, departamento, AI Score, fecha
- **Búsqueda**: Por nombre, email, posición
- **Ordenación**: Por cualquier columna

#### Métricas en Tiempo Real
- Total de aplicaciones
- Distribución por estado
- AI Score promedio
- Tasa de conversión

#### Acciones en Lote (Bulk Actions)
- Cambiar estado de múltiples candidatos
- Enviar notificaciones masivas
- Exportar datos a CSV

### 2.3 Gestión de Vacantes (Job Editor)

#### Creación y Edición de Posiciones
- Título y descripción del puesto
- Requisitos y responsabilidades
- Beneficios
- Tipo de contrato (Full-time, Part-time, Contrato, Prácticas)
- Ubicación
- Departamento
- Tags/etiquetas

#### Business Case Questions (BCQ)
- Editor de preguntas personalizadas
- Soporte para video-respuestas
- Opción de respuesta escrita adicional
- Orden configurable de preguntas

#### Preguntas Fijas de Entrevista
- Banco de preguntas por posición
- Categorización por tipo
- Priorización de preguntas
- Reutilizable entre candidatos

#### Prompts Personalizados para IA
- Prompt de sistema personalizado
- Instrucciones específicas para evaluación
- Criterios de priorización

#### Publicación en LinkedIn
- Generación automática de contenido con IA
- Optimizado para engagement
- Un clic para publicar

### 2.4 Proceso de Aplicación del Candidato

```
1. Candidato ve oferta → 2. Completa formulario → 3. Sube CV/DISC 
→ 4. Recibe confirmación → 5. Recruiter revisa → 6. Invitación BCQ
→ 7. Candidato completa BCQ → 8. Evaluación IA → 9. Entrevista
→ 10. Decisión final
```

#### Flujo Detallado:

1. **Aplicación Inicial**
   - Formulario con datos personales
   - Subida de documentos
   - Confirmación automática por email

2. **Invitación BCQ**
   - Email personalizado con link único
   - Token de acceso seguro
   - Tracking de apertura de link

3. **Portal BCQ**
   - Instrucciones claras
   - Grabación de video (máx 5 minutos por pregunta)
   - Resolución optimizada (360p)
   - Opción de respuesta escrita
   - Confirmación al completar

### 2.5 Sistema de BCQ (Business Case Questions)

El BCQ es el diferenciador clave de Young Recruitment:

#### Características del Portal BCQ
- **Acceso seguro**: Token único por candidato
- **Interfaz intuitiva**: Diseñada para reducir ansiedad
- **Grabación de video**: 
  - Countdown antes de grabar
  - Preview antes de enviar
  - Máximo 5 minutos por pregunta
  - Compresión automática (360p)
- **Transcripción automática**: Conversión de video a texto con IA
- **Tracking de tiempos**:
  - `bcq_invitation_sent_at`: Cuando se envió la invitación
  - `bcq_link_opened_at`: Cuando el candidato abrió el link
  - `bcq_started_at`: Cuando comenzó a responder
  - `business_case_completed_at`: Cuando finalizó
  - `bcq_response_time_minutes`: Tiempo total de respuesta

#### Detección de "Delayed"
- Si pasan más de 24 horas entre invitación y apertura
- Flag automático para revisión del recruiter
- Indicador visual en el dashboard

### 2.6 Perfil del Candidato (Vista Recruiter)

Cada candidato tiene un perfil completo con múltiples tabs:

#### Tab Overview
- **Header del candidato**: Nombre, email, posición, estado
- **AI Evaluation Card**: 
  - Overall Score (0-100)
  - Skills Match Score
  - Communication Score
  - Cultural Fit Score
  - Recomendación (Proceed/Review/Reject)
  - Fortalezas identificadas
  - Áreas de preocupación
- **Análisis de Documentos**:
  - Resumen de CV
  - Análisis DISC
  - Insights clave

#### Tab BCQ
- **Videos de respuestas**: Player integrado
- **Transcripciones**: Texto completo de cada respuesta
- **Análisis por pregunta**:
  - Puntuación de contenido
  - Puntuación de fluidez
  - Resumen de respuesta
  - Áreas para profundizar en entrevista
- **Botón de análisis Post-BCQ**: Re-evaluación con datos de video

#### Tab Interview
- **Preguntas generadas por IA**: Personalizadas para el candidato
- **Preguntas fijas del puesto**: Configuradas previamente
- **Programación de entrevista**:
  - Fecha y hora
  - Tipo (presencial/video/teléfono)
  - Link de reunión
  - Notas para el candidato
- **Evaluación post-entrevista**:
  - Scores por categoría
  - Fortalezas observadas
  - Áreas de mejora
  - Recomendación

#### Tab Final Evaluation
- **Evaluación consolidada**: Todas las fases combinadas
- **Progresión de scores**: Gráfico de evolución
- **Stage Progression**: Initial → Post-BCQ → Post-Interview → Final
- **Recomendación final**: Con justificación detallada
- **Decisión de contratación**: Hire/Reject/On Hold

### 2.7 Sistema de Entrevistas

#### Programación
- Selector de fecha/hora
- Tipo de entrevista (presencial, video, teléfono)
- Duración configurable
- Ubicación o link de reunión
- Notas internas y para candidato
- Notificación automática al candidato

#### Durante la Entrevista
- Acceso a preguntas generadas por IA
- Preguntas fijas del puesto
- Espacio para notas en tiempo real

#### Post-Entrevista
- Formulario de evaluación completo
- Scores por categoría
- Recomendación
- Historial de entrevistas previas

### 2.8 Comparación de Candidatos

Herramienta poderosa para decisiones finales:

#### Selección
- Checkbox en lista de candidatos
- Selección múltiple (2-10 candidatos)
- Solo candidatos del mismo puesto

#### Análisis Comparativo con IA
- **Ranking general**: Ordenados por puntuación
- **Comparación por categoría**: Skills, comunicación, cultural fit
- **Matriz de comparación**: Candidato vs candidato
- **Riesgos identificados**: Por cada candidato
- **Recomendación**: Mejor candidato con justificación

#### Executive Report
- Documento PDF generado automáticamente
- Incluye:
  - Resumen ejecutivo
  - Rankings detallados
  - Análisis por candidato
  - Recomendación final
- Opción de enviar por email

### 2.9 Analytics y Métricas

Dashboard completo de analytics:

#### Funnel de Conversión
- Aplicaciones → Reviewed → Interview → Hired
- Tasa de conversión por etapa
- Identificación de cuellos de botella

#### Tendencias de Aplicaciones
- Gráfico temporal de aplicaciones
- Por día/semana/mes
- Filtro por departamento

#### Performance por Puesto
- Aplicaciones por vacante
- AI Score promedio por puesto
- Tiempo promedio de contratación

#### Distribución de AI Scores
- Histograma de puntuaciones
- Comparativa por departamento
- Evolución temporal

#### Métricas de Tiempo
- Tiempo promedio de review
- Tiempo hasta entrevista
- Tiempo hasta decisión
- Tiempo total de contratación

---

## 3. Inteligencia Artificial - Detalle Completo

### 3.1 Análisis Automático de CV (`analyze-document`)

**Funcionalidad**: Extrae y analiza información del CV automáticamente.

**Proceso**:
1. Candidato sube CV en PDF
2. Sistema extrae texto del documento
3. IA analiza contenido
4. Genera resumen estructurado

**Output**:
- Experiencia laboral relevante
- Educación y certificaciones
- Habilidades técnicas identificadas
- Match con requisitos del puesto
- Score de compatibilidad inicial

**Tecnología**: Gemini 2.5 Flash (Lovable AI Gateway)

### 3.2 Evaluación Inicial de Candidatos (`analyze-candidate`)

**Funcionalidad**: Evaluación holística combinando CV + DISC + datos de aplicación.

**Análisis realizado**:
- Compatibilidad con requisitos del puesto
- Experiencia relevante
- Perfil de personalidad (DISC)
- Señales de potencial

**Scores generados**:
| Score | Descripción | Rango |
|-------|-------------|-------|
| Skills Match | Coincidencia de habilidades técnicas | 0-100 |
| Communication | Habilidades de comunicación | 0-100 |
| Cultural Fit | Encaje cultural | 0-100 |
| Overall | Puntuación general ponderada | 0-100 |

**Recomendación**:
- **Proceed**: Candidato prometedor, continuar proceso
- **Review**: Requiere evaluación adicional
- **Reject**: No cumple requisitos mínimos

**Extras**:
- Lista de fortalezas identificadas
- Lista de áreas de preocupación
- Resumen ejecutivo del candidato

### 3.3 Análisis de Respuestas BCQ (`analyze-bcq-response`)

**Funcionalidad**: Analiza cada respuesta de video del candidato.

**Métricas evaluadas**:

#### Calidad de Contenido
- Relevancia de la respuesta
- Profundidad del análisis
- Ejemplos concretos utilizados
- Estructura del argumento

#### Fluidez en Inglés
- Pronunciación
- Gramática
- Ritmo/pace
- Uso de hesitaciones
- Score general de fluidez

**Output por pregunta**:
- Score de contenido (0-100)
- Score de fluidez (0-100)
- Resumen de la respuesta
- Puntos clave identificados
- Áreas para profundizar en entrevista

### 3.4 Transcripción de Videos (`transcribe-video`)

**Funcionalidad**: Convierte automáticamente video a texto.

**Características**:
- Soporte multiidioma
- Alta precisión con acentos
- Puntuación automática
- Base para análisis posterior

**Tecnología**: Gemini 2.5 Flash con capacidad de audio

### 3.5 Análisis Post-BCQ (`analyze-post-bcq`)

**Funcionalidad**: Re-evaluación del candidato después de completar BCQ.

**Proceso**:
1. Toma evaluación inicial
2. Incorpora datos de BCQ (transcripciones, scores)
3. Recalcula scores
4. Genera nueva recomendación

**Output**:
- Scores actualizados (pre_bcq → post_bcq)
- Explicación de cambios
- Nueva recomendación si aplica
- Insights adicionales del video

### 3.6 Generación de Preguntas de Entrevista (`generate-interview-questions`)

**Funcionalidad**: Crea preguntas personalizadas para cada candidato.

**Fuentes de información**:
- Análisis de CV
- Respuestas BCQ
- Requisitos del puesto
- Áreas de preocupación identificadas
- Prompt personalizado del job

**Tipos de preguntas generadas**:
- Técnicas/competencias
- Situacionales (STAR)
- Culturales
- Motivacionales
- Específicas del candidato

**Características**:
- 8-12 preguntas por candidato
- Ordenadas por prioridad
- Incluye reasoning (por qué hacer esta pregunta)
- Categorización automática

### 3.7 Análisis de Entrevista (`analyze-interview`)

**Funcionalidad**: Evaluación post-entrevista con actualización de scores.

**Input**:
- Evaluación del entrevistador
- Notas de la entrevista
- Respuestas a preguntas específicas

**Output**:
- Scores post-entrevista
- Comparación con evaluación previa
- Insights adicionales
- Recomendación actualizada

### 3.8 Evaluación Final (`analyze-final`)

**Funcionalidad**: Consolidación de todas las fases de evaluación.

**Datos consolidados**:
- Evaluación inicial (CV + DISC)
- Análisis BCQ completo
- Evaluación de entrevista
- Notas del recruiter

**Output**:
- **Score final consolidado**
- **Stage Progression**: Gráfico de evolución
  ```
  Initial (65) → Post-BCQ (72) → Post-Interview (78) → Final (80)
  ```
- **Recomendación final de contratación**
- **Resumen ejecutivo completo**
- **Consideraciones de contratación**:
  - Fortalezas clave
  - Áreas de desarrollo
  - Riesgos potenciales
  - Fit con el equipo

### 3.9 Comparación Inteligente de Candidatos (`compare-candidates`)

**Funcionalidad**: Análisis comparativo de múltiples candidatos.

**Capacidades**:
- Comparar 2-10 candidatos simultáneamente
- Solo candidatos del mismo puesto

**Análisis generado**:

#### Rankings
- Ranking general
- Ranking por categoría (skills, communication, cultural fit)
- Ranking por BCQ performance

#### Matriz de Comparación
| Candidato | Skills | Comm | Culture | Overall | Rank |
|-----------|--------|------|---------|---------|------|
| Juan P.   | 85     | 78   | 82      | 82      | 1    |
| María G.  | 80     | 85   | 75      | 80      | 2    |
| Carlos R. | 75     | 72   | 80      | 76      | 3    |

#### Análisis por Candidato
- Fortalezas únicas
- Debilidades relativas
- Diferenciadores vs competencia

#### Riesgos Identificados
- Por candidato
- Impacto potencial
- Mitigación sugerida

#### Recomendación Final
- Mejor candidato
- Justificación detallada
- Alternativas recomendadas

### 3.10 Generación de Posts LinkedIn (`generate-linkedin-post`)

**Funcionalidad**: Crea contenido optimizado para LinkedIn.

**Input**:
- Título del puesto
- Descripción
- Requisitos
- Beneficios
- Cultura de empresa

**Output**:
- Post optimizado para engagement
- Hashtags relevantes
- Call to action
- Formato atractivo con emojis

### 3.11 Asistente IA Conversacional

**Funcionalidad**: Chat integrado para consultas sobre candidatos.

**Capacidades**:
- Preguntas sobre candidatos específicos
- Comparaciones rápidas
- Insights bajo demanda
- Sugerencias contextuales

**Ejemplos de uso**:
- "¿Cuáles son las principales fortalezas de este candidato?"
- "¿Qué preguntas debería hacer en la entrevista?"
- "¿Cómo se compara con otros candidatos?"
- "¿Cuáles son los riesgos de contratar a esta persona?"

---

## 4. ROI y Ahorro de Costes

### 4.1 Tiempo Ahorrado por Tarea

| Tarea | Tiempo Manual | Con Young Recruitment | Ahorro |
|-------|---------------|----------------------|--------|
| Screening inicial de CV | 15-30 min/candidato | 2-3 seg (automático) | **98%** |
| Lectura y evaluación de CV | 10-15 min/candidato | 0 (automático) | **100%** |
| Evaluación de video BCQ | 20-45 min/candidato | 1-2 min (transcripción + análisis) | **95%** |
| Preparar preguntas de entrevista | 30-60 min/candidato | 30 seg (generación IA) | **98%** |
| Tomar notas durante entrevista | 15-20 min/entrevista | 5 min (estructura predefinida) | **75%** |
| Comparar 5 candidatos finales | 2-4 horas | 5 min (report automático) | **95%** |
| Escribir job post para LinkedIn | 30-60 min | 1 min (generación IA) | **97%** |
| Enviar emails de seguimiento | 5-10 min/candidato | 0 (automático) | **100%** |
| Generar reportes ejecutivos | 1-2 horas | 2 min (automático) | **98%** |

### 4.2 Cálculo de Ahorro por Proceso de Selección

**Escenario**: Proceso de selección con 50 candidatos

| Etapa | Tiempo Manual | Con Young Recruitment |
|-------|---------------|----------------------|
| Screening 50 CVs | 25 horas | 0 horas |
| Evaluación 20 BCQs | 15 horas | 30 min |
| Preparar 10 entrevistas | 7.5 horas | 5 min |
| Comparar 5 finalistas | 3 horas | 5 min |
| Comunicaciones | 5 horas | 0 horas |
| **TOTAL** | **55.5 horas** | **45 min** |

**Ahorro por proceso**: ~55 horas = **~7 días laborales**

### 4.3 Reducción de Errores Humanos

#### Evaluación Objetiva y Consistente
- Mismos criterios para todos los candidatos
- Sin variación por fatiga del evaluador
- Sin influencia del orden de evaluación

#### Eliminación de Sesgos Inconscientes
- Sin sesgo por nombre/género/edad
- Sin sesgo por universidad/empresa anterior
- Evaluación basada puramente en competencias

#### Criterios Estandarizados
- Scores comparables entre candidatos
- Histórico para mejora continua
- Benchmark por posición

#### Trazabilidad Completa
- Registro de cada evaluación
- Justificación de decisiones
- Compliance con regulaciones

### 4.4 Escalabilidad

| Métrica | Recruiter Manual | Young Recruitment |
|---------|-----------------|-------------------|
| Candidatos/día (screening) | 20-30 | Ilimitado |
| Procesos simultáneos | 3-5 | Ilimitado |
| Calidad con volumen alto | Decrece | Constante |
| Coste por candidato adicional | Lineal | Cercano a 0 |

### 4.5 Mejor Calidad de Contratación

#### Identificación de Top Talent
- AI Score identifica mejores candidatos rápidamente
- Menos tiempo perdido en candidatos no cualificados
- Foco en candidatos con mayor potencial

#### Reducción de Bad Hires
- Evaluación más completa
- Detección de red flags
- Decisiones más informadas

**Coste de un bad hire**: 1.5x-2x salario anual
**Reducción estimada de bad hires**: 30-50%

#### Mejor Cultural Fit
- Evaluación de soft skills con IA
- Análisis de comunicación en video
- Match con valores de empresa

### 4.6 Cálculo de ROI Estimado

#### Costes de Referencia
- Salario recruiter senior: €50,000/año
- Coste total empleador: €65,000/año
- Horas productivas/año: 1,760

#### Ahorro Calculado

**Tiempo ahorrado**: 60-70% del tiempo de recruiting

```
Ahorro en tiempo = 70% × €65,000 = €45,500/año por recruiter
```

**Reducción de bad hires**:

```
Salario promedio contratado: €40,000
Coste bad hire: €60,000-80,000
Reducción 40%: €24,000-32,000/año (asumiendo 1 bad hire evitado)
```

**Ahorro total estimado**: €69,500-77,500/año

#### ROI

```
Inversión en Young Recruitment: €15,000-20,000/año (estimado)
Ahorro total: €69,500-77,500/año
ROI = (Ahorro - Inversión) / Inversión
ROI = (€69,500 - €20,000) / €20,000 = 247%
```

**ROI estimado: 2.5x - 4x en el primer año**

---

## 5. Tecnología y Seguridad

### Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Frontend | React + TypeScript + Vite |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL) |
| Edge Functions | Deno (Supabase Functions) |
| IA | Gemini 2.5 Flash (Lovable AI Gateway) |
| Almacenamiento | Supabase Storage |
| Autenticación | Supabase Auth |
| Emails | Resend |

### Seguridad

#### Row Level Security (RLS)
- Políticas de acceso por usuario
- Datos aislados por tenant
- Acceso mínimo necesario

#### Autenticación Robusta
- Login con email/password
- Roles de usuario (admin, recruiter, candidate)
- Sesiones seguras

#### Almacenamiento Seguro
- CVs y documentos encriptados
- Videos en buckets privados
- Acceso con tokens temporales

#### GDPR Compliance-Ready
- Consentimiento explícito
- Derecho al olvido implementable
- Logs de acceso

---

## 6. Casos de Uso

### 6.1 Startups en Fase de Crecimiento
- Alto volumen de contratación
- Equipo de HR pequeño
- Necesidad de escalar rápido
- Presupuesto limitado

### 6.2 Empresas Internacionales
- Candidatos de múltiples países
- Evaluación de inglés crítica
- Procesos estandarizados globalmente
- Timezone independence

### 6.3 Contratación Técnica
- Evaluación de competencias específicas
- Preguntas técnicas personalizadas
- Comparación objetiva de candidatos
- Reducción de bias técnico

### 6.4 Ramp-up Masivo
- Apertura de nuevas oficinas
- Proyectos con deadline
- Contratación de 50+ personas
- Sin añadir recruiters

---

## 7. Conclusión

### Beneficios Clave

✅ **Ahorro de tiempo**: 60-70% menos tiempo en tareas de recruiting
✅ **Consistencia**: Evaluaciones objetivas y estandarizadas
✅ **Escalabilidad**: Sin límite de candidatos procesados
✅ **Calidad**: Mejores contrataciones, menos bad hires
✅ **Datos**: Decisiones basadas en evidencia

### Diferenciadores vs Competencia

| Feature | Young Recruitment | ATS Tradicional |
|---------|-------------------|-----------------|
| Análisis de CV con IA | ✅ Automático | ❌ Manual |
| Video BCQ | ✅ Integrado | ❌ No disponible |
| Transcripción automática | ✅ Sí | ❌ No |
| Generación de preguntas | ✅ IA personalizada | ❌ Templates fijos |
| Comparación de candidatos | ✅ IA comparativa | ❌ Manual |
| Evaluación de inglés | ✅ Automática | ❌ Manual |
| Executive Reports | ✅ Generados por IA | ❌ Manual |

### Próximos Pasos

1. **Demo personalizada**: Solicita una demostración con tus casos de uso
2. **Prueba piloto**: Implementación con un proceso real
3. **Implementación completa**: Rollout en toda la organización

---
---
---

# 🇬🇧 ENGLISH VERSION

---

## 1. Introduction

**Young Recruitment** is a comprehensive AI-powered talent management platform that revolutionizes the hiring process. Designed for companies looking to optimize their recruitment processes, the platform automates the most tedious recruiting tasks while maintaining quality and the human touch in final decisions.

### Problem Solved

Traditional recruitment presents multiple challenges:
- **High time consumption**: A recruiter spends 15-30 minutes per CV on initial screening
- **Inconsistent evaluations**: Different evaluators, different criteria
- **Unconscious biases**: Decisions influenced by irrelevant factors
- **Limited scalability**: Difficult to handle hiring peaks
- **Talent loss**: Slow processes cause the best candidates to accept other offers

Young Recruitment solves these problems through intelligent automation and AI analysis.

---

## 2. Main Features

### 2.1 Public Job Portal

#### Job Listings (`/jobs`)
- Attractive display of all open positions
- Filters by department, contract type, and location
- Responsive design optimized for mobile
- SEO optimized to attract organic candidates

#### Position Detail Page (`/jobs/:id`)
- Complete job description
- Requirements and responsibilities
- Benefits offered
- Direct application button

#### Application Form (`/apply/:id`)
- Candidate personal data
- CV upload (PDF)
- DISC profile upload (optional)
- Real-time validation
- Automatic email confirmation

### 2.2 Recruiter Dashboard

The control center for managing the entire selection process:

#### Main Panel
- **Applications view**: Complete table with all candidates
- **Advanced filters**: By status, department, AI Score, date
- **Search**: By name, email, position
- **Sorting**: By any column

#### Real-Time Metrics
- Total applications
- Distribution by status
- Average AI Score
- Conversion rate

#### Bulk Actions
- Change status of multiple candidates
- Send mass notifications
- Export data to CSV

### 2.3 Job Management (Job Editor)

#### Position Creation and Editing
- Job title and description
- Requirements and responsibilities
- Benefits
- Contract type (Full-time, Part-time, Contract, Internship)
- Location
- Department
- Tags

#### Business Case Questions (BCQ)
- Custom question editor
- Support for video responses
- Additional written response option
- Configurable question order

#### Fixed Interview Questions
- Question bank per position
- Categorization by type
- Question prioritization
- Reusable across candidates

#### Custom AI Prompts
- Custom system prompt
- Specific evaluation instructions
- Prioritization criteria

#### LinkedIn Publishing
- Automatic content generation with AI
- Optimized for engagement
- One-click publishing

### 2.4 Candidate Application Process

```
1. Candidate sees offer → 2. Completes form → 3. Uploads CV/DISC 
→ 4. Receives confirmation → 5. Recruiter reviews → 6. BCQ invitation
→ 7. Candidate completes BCQ → 8. AI evaluation → 9. Interview
→ 10. Final decision
```

#### Detailed Flow:

1. **Initial Application**
   - Form with personal data
   - Document upload
   - Automatic email confirmation

2. **BCQ Invitation**
   - Personalized email with unique link
   - Secure access token
   - Link opening tracking

3. **BCQ Portal**
   - Clear instructions
   - Video recording (max 5 minutes per question)
   - Optimized resolution (360p)
   - Written response option
   - Confirmation upon completion

### 2.5 BCQ System (Business Case Questions)

BCQ is the key differentiator of Young Recruitment:

#### BCQ Portal Features
- **Secure access**: Unique token per candidate
- **Intuitive interface**: Designed to reduce anxiety
- **Video recording**: 
  - Countdown before recording
  - Preview before sending
  - Maximum 5 minutes per question
  - Automatic compression (360p)
- **Automatic transcription**: Video to text conversion with AI
- **Time tracking**:
  - `bcq_invitation_sent_at`: When invitation was sent
  - `bcq_link_opened_at`: When candidate opened the link
  - `bcq_started_at`: When they started responding
  - `business_case_completed_at`: When they finished
  - `bcq_response_time_minutes`: Total response time

#### "Delayed" Detection
- If more than 24 hours pass between invitation and opening
- Automatic flag for recruiter review
- Visual indicator in dashboard

### 2.6 Candidate Profile (Recruiter View)

Each candidate has a complete profile with multiple tabs:

#### Overview Tab
- **Candidate header**: Name, email, position, status
- **AI Evaluation Card**: 
  - Overall Score (0-100)
  - Skills Match Score
  - Communication Score
  - Cultural Fit Score
  - Recommendation (Proceed/Review/Reject)
  - Identified strengths
  - Areas of concern
- **Document Analysis**:
  - CV summary
  - DISC analysis
  - Key insights

#### BCQ Tab
- **Response videos**: Integrated player
- **Transcriptions**: Full text of each response
- **Analysis per question**:
  - Content score
  - Fluency score
  - Response summary
  - Areas to explore in interview
- **Post-BCQ analysis button**: Re-evaluation with video data

#### Interview Tab
- **AI-generated questions**: Personalized for the candidate
- **Fixed position questions**: Pre-configured
- **Interview scheduling**:
  - Date and time
  - Type (in-person/video/phone)
  - Meeting link
  - Notes for candidate
- **Post-interview evaluation**:
  - Scores by category
  - Observed strengths
  - Areas for improvement
  - Recommendation

#### Final Evaluation Tab
- **Consolidated evaluation**: All phases combined
- **Score progression**: Evolution graph
- **Stage Progression**: Initial → Post-BCQ → Post-Interview → Final
- **Final recommendation**: With detailed justification
- **Hiring decision**: Hire/Reject/On Hold

### 2.7 Interview System

#### Scheduling
- Date/time selector
- Interview type (in-person, video, phone)
- Configurable duration
- Location or meeting link
- Internal and candidate notes
- Automatic notification to candidate

#### During Interview
- Access to AI-generated questions
- Fixed position questions
- Space for real-time notes

#### Post-Interview
- Complete evaluation form
- Scores by category
- Recommendation
- Previous interview history

### 2.8 Candidate Comparison

Powerful tool for final decisions:

#### Selection
- Checkbox in candidate list
- Multiple selection (2-10 candidates)
- Only candidates from the same position

#### Comparative AI Analysis
- **General ranking**: Ordered by score
- **Category comparison**: Skills, communication, cultural fit
- **Comparison matrix**: Candidate vs candidate
- **Identified risks**: For each candidate
- **Recommendation**: Best candidate with justification

#### Executive Report
- Automatically generated PDF document
- Includes:
  - Executive summary
  - Detailed rankings
  - Analysis per candidate
  - Final recommendation
- Option to send by email

### 2.9 Analytics and Metrics

Complete analytics dashboard:

#### Conversion Funnel
- Applications → Reviewed → Interview → Hired
- Conversion rate per stage
- Bottleneck identification

#### Application Trends
- Temporal graph of applications
- By day/week/month
- Filter by department

#### Performance by Position
- Applications per vacancy
- Average AI Score per position
- Average time to hire

#### AI Score Distribution
- Score histogram
- Comparison by department
- Temporal evolution

#### Time Metrics
- Average review time
- Time to interview
- Time to decision
- Total hiring time

---

## 3. Artificial Intelligence - Complete Detail

### 3.1 Automatic CV Analysis (`analyze-document`)

**Functionality**: Automatically extracts and analyzes CV information.

**Process**:
1. Candidate uploads PDF CV
2. System extracts document text
3. AI analyzes content
4. Generates structured summary

**Output**:
- Relevant work experience
- Education and certifications
- Identified technical skills
- Match with position requirements
- Initial compatibility score

**Technology**: Gemini 2.5 Flash (Lovable AI Gateway)

### 3.2 Initial Candidate Evaluation (`analyze-candidate`)

**Functionality**: Holistic evaluation combining CV + DISC + application data.

**Analysis performed**:
- Compatibility with position requirements
- Relevant experience
- Personality profile (DISC)
- Potential signals

**Generated scores**:
| Score | Description | Range |
|-------|-------------|-------|
| Skills Match | Technical skills match | 0-100 |
| Communication | Communication skills | 0-100 |
| Cultural Fit | Cultural alignment | 0-100 |
| Overall | Weighted general score | 0-100 |

**Recommendation**:
- **Proceed**: Promising candidate, continue process
- **Review**: Requires additional evaluation
- **Reject**: Does not meet minimum requirements

**Extras**:
- List of identified strengths
- List of areas of concern
- Candidate executive summary

### 3.3 BCQ Response Analysis (`analyze-bcq-response`)

**Functionality**: Analyzes each video response from the candidate.

**Evaluated metrics**:

#### Content Quality
- Response relevance
- Analysis depth
- Concrete examples used
- Argument structure

#### English Fluency
- Pronunciation
- Grammar
- Rhythm/pace
- Use of hesitations
- Overall fluency score

**Output per question**:
- Content score (0-100)
- Fluency score (0-100)
- Response summary
- Key points identified
- Areas to explore in interview

### 3.4 Video Transcription (`transcribe-video`)

**Functionality**: Automatically converts video to text.

**Features**:
- Multi-language support
- High accuracy with accents
- Automatic punctuation
- Base for subsequent analysis

**Technology**: Gemini 2.5 Flash with audio capability

### 3.5 Post-BCQ Analysis (`analyze-post-bcq`)

**Functionality**: Candidate re-evaluation after completing BCQ.

**Process**:
1. Takes initial evaluation
2. Incorporates BCQ data (transcriptions, scores)
3. Recalculates scores
4. Generates new recommendation

**Output**:
- Updated scores (pre_bcq → post_bcq)
- Explanation of changes
- New recommendation if applicable
- Additional video insights

### 3.6 Interview Question Generation (`generate-interview-questions`)

**Functionality**: Creates personalized questions for each candidate.

**Information sources**:
- CV analysis
- BCQ responses
- Position requirements
- Identified areas of concern
- Custom job prompt

**Types of generated questions**:
- Technical/competency
- Situational (STAR)
- Cultural
- Motivational
- Candidate-specific

**Features**:
- 8-12 questions per candidate
- Ordered by priority
- Includes reasoning (why ask this question)
- Automatic categorization

### 3.7 Interview Analysis (`analyze-interview`)

**Functionality**: Post-interview evaluation with score update.

**Input**:
- Interviewer evaluation
- Interview notes
- Responses to specific questions

**Output**:
- Post-interview scores
- Comparison with previous evaluation
- Additional insights
- Updated recommendation

### 3.8 Final Evaluation (`analyze-final`)

**Functionality**: Consolidation of all evaluation phases.

**Consolidated data**:
- Initial evaluation (CV + DISC)
- Complete BCQ analysis
- Interview evaluation
- Recruiter notes

**Output**:
- **Final consolidated score**
- **Stage Progression**: Evolution graph
  ```
  Initial (65) → Post-BCQ (72) → Post-Interview (78) → Final (80)
  ```
- **Final hiring recommendation**
- **Complete executive summary**
- **Hiring considerations**:
  - Key strengths
  - Development areas
  - Potential risks
  - Team fit

### 3.9 Intelligent Candidate Comparison (`compare-candidates`)

**Functionality**: Comparative analysis of multiple candidates.

**Capabilities**:
- Compare 2-10 candidates simultaneously
- Only candidates from the same position

**Generated analysis**:

#### Rankings
- General ranking
- Category ranking (skills, communication, cultural fit)
- BCQ performance ranking

#### Comparison Matrix
| Candidate | Skills | Comm | Culture | Overall | Rank |
|-----------|--------|------|---------|---------|------|
| John P.   | 85     | 78   | 82      | 82      | 1    |
| Mary G.   | 80     | 85   | 75      | 80      | 2    |
| Charles R.| 75     | 72   | 80      | 76      | 3    |

#### Per-Candidate Analysis
- Unique strengths
- Relative weaknesses
- Differentiators vs competition

#### Identified Risks
- Per candidate
- Potential impact
- Suggested mitigation

#### Final Recommendation
- Best candidate
- Detailed justification
- Recommended alternatives

### 3.10 LinkedIn Post Generation (`generate-linkedin-post`)

**Functionality**: Creates optimized content for LinkedIn.

**Input**:
- Job title
- Description
- Requirements
- Benefits
- Company culture

**Output**:
- Engagement-optimized post
- Relevant hashtags
- Call to action
- Attractive format with emojis

### 3.11 Conversational AI Assistant

**Functionality**: Integrated chat for candidate queries.

**Capabilities**:
- Questions about specific candidates
- Quick comparisons
- On-demand insights
- Contextual suggestions

**Usage examples**:
- "What are the main strengths of this candidate?"
- "What questions should I ask in the interview?"
- "How does this compare to other candidates?"
- "What are the risks of hiring this person?"

---

## 4. ROI and Cost Savings

### 4.1 Time Saved per Task

| Task | Manual Time | With Young Recruitment | Savings |
|------|-------------|----------------------|---------|
| Initial CV screening | 15-30 min/candidate | 2-3 sec (automatic) | **98%** |
| CV reading and evaluation | 10-15 min/candidate | 0 (automatic) | **100%** |
| BCQ video evaluation | 20-45 min/candidate | 1-2 min (transcription + analysis) | **95%** |
| Prepare interview questions | 30-60 min/candidate | 30 sec (AI generation) | **98%** |
| Take notes during interview | 15-20 min/interview | 5 min (predefined structure) | **75%** |
| Compare 5 final candidates | 2-4 hours | 5 min (automatic report) | **95%** |
| Write LinkedIn job post | 30-60 min | 1 min (AI generation) | **97%** |
| Send follow-up emails | 5-10 min/candidate | 0 (automatic) | **100%** |
| Generate executive reports | 1-2 hours | 2 min (automatic) | **98%** |

### 4.2 Savings Calculation per Selection Process

**Scenario**: Selection process with 50 candidates

| Stage | Manual Time | With Young Recruitment |
|-------|-------------|----------------------|
| Screening 50 CVs | 25 hours | 0 hours |
| Evaluating 20 BCQs | 15 hours | 30 min |
| Preparing 10 interviews | 7.5 hours | 5 min |
| Comparing 5 finalists | 3 hours | 5 min |
| Communications | 5 hours | 0 hours |
| **TOTAL** | **55.5 hours** | **45 min** |

**Savings per process**: ~55 hours = **~7 working days**

### 4.3 Reduction of Human Errors

#### Objective and Consistent Evaluation
- Same criteria for all candidates
- No variation due to evaluator fatigue
- No influence from evaluation order

#### Elimination of Unconscious Biases
- No bias by name/gender/age
- No bias by university/previous company
- Evaluation based purely on competencies

#### Standardized Criteria
- Comparable scores between candidates
- Historical data for continuous improvement
- Benchmark by position

#### Complete Traceability
- Record of each evaluation
- Decision justification
- Compliance with regulations

### 4.4 Scalability

| Metric | Manual Recruiter | Young Recruitment |
|--------|-----------------|-------------------|
| Candidates/day (screening) | 20-30 | Unlimited |
| Simultaneous processes | 3-5 | Unlimited |
| Quality with high volume | Decreases | Constant |
| Cost per additional candidate | Linear | Near 0 |

### 4.5 Better Hiring Quality

#### Top Talent Identification
- AI Score quickly identifies best candidates
- Less time wasted on unqualified candidates
- Focus on highest-potential candidates

#### Reduction of Bad Hires
- More complete evaluation
- Red flag detection
- More informed decisions

**Cost of a bad hire**: 1.5x-2x annual salary
**Estimated bad hire reduction**: 30-50%

#### Better Cultural Fit
- Soft skills evaluation with AI
- Communication analysis in video
- Match with company values

### 4.6 Estimated ROI Calculation

#### Reference Costs
- Senior recruiter salary: €50,000/year
- Total employer cost: €65,000/year
- Productive hours/year: 1,760

#### Calculated Savings

**Time saved**: 60-70% of recruiting time

```
Time savings = 70% × €65,000 = €45,500/year per recruiter
```

**Bad hire reduction**:

```
Average hired salary: €40,000
Bad hire cost: €60,000-80,000
40% reduction: €24,000-32,000/year (assuming 1 bad hire avoided)
```

**Total estimated savings**: €69,500-77,500/year

#### ROI

```
Investment in Young Recruitment: €15,000-20,000/year (estimated)
Total savings: €69,500-77,500/year
ROI = (Savings - Investment) / Investment
ROI = (€69,500 - €20,000) / €20,000 = 247%
```

**Estimated ROI: 2.5x - 4x in the first year**

---

## 5. Technology and Security

### Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + TypeScript + Vite |
| Styles | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL) |
| Edge Functions | Deno (Supabase Functions) |
| AI | Gemini 2.5 Flash (Lovable AI Gateway) |
| Storage | Supabase Storage |
| Authentication | Supabase Auth |
| Emails | Resend |

### Security

#### Row Level Security (RLS)
- Access policies per user
- Data isolated by tenant
- Minimum necessary access

#### Robust Authentication
- Email/password login
- User roles (admin, recruiter, candidate)
- Secure sessions

#### Secure Storage
- Encrypted CVs and documents
- Videos in private buckets
- Access with temporary tokens

#### GDPR Compliance-Ready
- Explicit consent
- Right to be forgotten implementable
- Access logs

---

## 6. Use Cases

### 6.1 Startups in Growth Phase
- High volume hiring
- Small HR team
- Need to scale quickly
- Limited budget

### 6.2 International Companies
- Candidates from multiple countries
- Critical English evaluation
- Globally standardized processes
- Timezone independence

### 6.3 Technical Hiring
- Specific competency evaluation
- Personalized technical questions
- Objective candidate comparison
- Technical bias reduction

### 6.4 Massive Ramp-up
- Opening new offices
- Projects with deadlines
- Hiring 50+ people
- Without adding recruiters

---

## 7. Conclusion

### Key Benefits

✅ **Time savings**: 60-70% less time on recruiting tasks
✅ **Consistency**: Objective and standardized evaluations
✅ **Scalability**: No limit on processed candidates
✅ **Quality**: Better hires, fewer bad hires
✅ **Data**: Evidence-based decisions

### Differentiators vs Competition

| Feature | Young Recruitment | Traditional ATS |
|---------|-------------------|-----------------|
| CV analysis with AI | ✅ Automatic | ❌ Manual |
| Video BCQ | ✅ Integrated | ❌ Not available |
| Automatic transcription | ✅ Yes | ❌ No |
| Question generation | ✅ Personalized AI | ❌ Fixed templates |
| Candidate comparison | ✅ Comparative AI | ❌ Manual |
| English evaluation | ✅ Automatic | ❌ Manual |
| Executive Reports | ✅ AI-generated | ❌ Manual |

### Next Steps

1. **Personalized demo**: Request a demonstration with your use cases
2. **Pilot test**: Implementation with a real process
3. **Full implementation**: Rollout across the organization

---

**© 2024 Young Recruitment - AI-Powered Talent Acquisition**
