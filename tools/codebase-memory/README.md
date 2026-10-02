# Codebase Memory MCP (Base de Datos Vectorial y Grafo de Conocimiento)

Este directorio contiene las herramientas y el script de instalación para **codebase-memory-mcp**.

## ¿Qué es?
`codebase-memory-mcp` indexa todo el código del proyecto y genera un **grafo de conocimiento enriquecido con embeddings (base de datos vectorial)**. Permite que los agentes de IA comprendan la arquitectura completa, busquen funciones por similitud semántica y tracen dependencias en tiempo real sin saturar la ventana de contexto.

## Archivos en esta carpeta
- `install.ps1`: Script automatizado en PowerShell para descargar el binario para Windows, verificar su suma de comprobación (SHA-256), agregarlo al PATH del usuario y configurar las herramientas MCP para los agentes.
- `README.md`: Documentación de uso.

## Instrucciones de Instalación

Abre PowerShell en esta carpeta y ejecuta:

```powershell
# Instalación estándar (recomendada para agentes y CLI)
.\install.ps1

# O si deseas la variante con interfaz visual (UI):
.\install.ps1 --ui
```

Una vez finalizada la instalación, reinicia tu terminal y tu entorno de desarrollo para comenzar a indexar el proyecto.
