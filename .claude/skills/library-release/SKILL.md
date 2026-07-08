---
name: library-release
description: "Bump версий пакетов и зависимостей"
---

# /library-release — Bump версий библиотек

## Процесс

1. Изменить код пакета в `libs/backend/<package>/`
2. Бампить версию в `.csproj` (`<Version>`)
3. Создать MR → merge в `master`
4. GitLab CI публикует пакет в NuGet
5. Обновить `<PackageReference>` во всех потребителях

## Порядок

Топологический: зависимости → потребители
