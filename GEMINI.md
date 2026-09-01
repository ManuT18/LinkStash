# Directivas de Proyecto y Reglas de Desarrollo - LinkStash

## 1. Gestión de Git y Flujo de Trabajo
- **Prohibición de Encadenamiento**: NUNCA encadenes `git add` y `git commit` en una misma línea (`git add . ; git commit` o `&&`). Ejecutá siempre `git add <archivos>` como un paso independiente y, tras verificar estado, `git commit -m "<mensaje>"` como un paso separado.
- **Commits Granulares**: Realizá commits frecuentes y atómicos agrupando únicamente los archivos relacionados con cada hito.
- **Idioma**: Mensajes de commit siempre en español por defecto.

## 2. Autonomía en Tests y Lecturas
- **Cero Consultas Innecesarias**: No pidas aprobación ni confirmación para ejecutar tests automatizados (`npm run test`, E2E, linter) ni para leer/inspeccionar archivos del repositorio. Ejecutalos directamente con alta agencia.

## 3. Prioridad Obligatoria de Herramientas Nativas
- **Uso de Herramientas de la Plataforma**: NUNCA utilices scripts de terminal (PowerShell o Bash) para tareas donde existan herramientas nativas:
  - Usar `view_file` en vez de `cat`, `Get-Content` o `type`.
  - Usar `grep_search` en vez de `Select-String`, `grep` o `findstr`.
  - Usar `find_by_name` o `list_dir` en vez de `Get-ChildItem`, `dir` o `ls`.
  - Usar `replace_file_content` o `write_to_file` en vez de `sed` o redirecciones.

## 4. Seguridad Estricta
- Aplicar siempre las reglas de `security_rules.md`:
  - Cero hardcoding de claves API, tokens o contraseñas.
  - Uso exclusivo de variables de entorno con verificaciones defensivas.
  - Mantener `.gitignore` y `.env.example` protegidos y actualizados.
  - Consultas SQL siempre parametrizadas contra inyecciones.
